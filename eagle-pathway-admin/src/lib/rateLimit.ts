import { createClient } from '@supabase/supabase-js';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch seconds when the current window resets. 0 when unknown. */
  reset: number;
}

/**
 * Enforce a fixed-window rate limit for an AI request, keyed per user + action.
 *
 * Backed by the `check_ai_rate_limit` Postgres function (see the
 * supabase_migration_ai_rate_limit migration), so the limit is shared across
 * all serverless instances — unlike an in-memory limiter.
 *
 * Fails open: if the limiter backend is unconfigured or errors, the request is
 * allowed. A cost-control layer must never take down the product when it is
 * itself unavailable.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer the service role key when present; the function is security-definer
  // and granted to anon, so the public key works too.
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !apiKey) {
    return { allowed: true, limit, remaining: limit, reset: 0 };
  }

  try {
    const supabase = createClient(supabaseUrl, apiKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error || !data) {
      console.error('Rate limit check failed, allowing request:', error?.message);
      return { allowed: true, limit, remaining: limit, reset: 0 };
    }

    const result = data as Record<string, unknown>;
    return {
      allowed: Boolean(result.allowed),
      limit: Number(result.limit ?? limit),
      remaining: Number(result.remaining ?? 0),
      reset: Number(result.reset ?? 0),
    };
  } catch (err) {
    console.error('Rate limit check threw, allowing request:', err);
    return { allowed: true, limit, remaining: limit, reset: 0 };
  }
}

/** Standard rate-limit response headers for a result. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };

  if (result.reset) {
    headers['X-RateLimit-Reset'] = String(result.reset);
    if (!result.allowed) {
      const retryAfter = Math.max(0, Math.ceil(result.reset - Date.now() / 1000));
      headers['Retry-After'] = String(retryAfter);
    }
  }

  return headers;
}
