-- AI endpoint rate limiting.
--
-- The AI routes (api/sop-review, api/assistant) proxy to Groq, which is billed
-- per request. They were auth-gated but uncapped, so any single authenticated
-- user could run up cost. This adds an atomic fixed-window counter, keyed per
-- user + endpoint, callable from the serverless routes.

create table if not exists public.ai_rate_limit (
  key           text        not null,
  window_start  timestamptz not null,
  count         integer     not null default 0,
  primary key (key, window_start)
);

-- The table is only ever touched by the security-definer function below (and
-- the service role). Enable RLS with no policies so nothing else can read it.
alter table public.ai_rate_limit enable row level security;

-- Atomically increment the counter for the current window and report status.
-- Returns: { allowed, count, limit, remaining, reset (epoch seconds) }.
create or replace function public.check_ai_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Snap to the start of the current fixed window.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.ai_rate_limit (key, window_start, count)
    values (p_key, v_window_start, 1)
  on conflict (key, window_start)
    do update set count = public.ai_rate_limit.count + 1
  returning count into v_count;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'count', v_count,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - v_count),
    'reset', floor(extract(epoch from v_window_start)) + p_window_seconds
  );
end;
$$;

grant execute on function public.check_ai_rate_limit(text, integer, integer)
  to anon, authenticated, service_role;

-- Housekeeping: purge expired windows. Wire to a scheduled job (pg_cron) or
-- call periodically; not required for correctness.
create or replace function public.purge_ai_rate_limit(p_older_than_seconds integer default 3600)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.ai_rate_limit
  where window_start < now() - make_interval(secs => p_older_than_seconds);
$$;
