-- ============================================================
-- CLIENT ERROR LOG
-- A lightweight, queryable sink for client-side errors from the admin and
-- mobile apps, in lieu of a third-party APM. Written by the shared logger's
-- Supabase sink; readable only by admins.
-- ============================================================

CREATE TABLE IF NOT EXISTS client_errors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level       TEXT NOT NULL DEFAULT 'error',
  message     TEXT NOT NULL,
  context     JSONB NOT NULL DEFAULT '{}',
  stack       TEXT,
  platform    TEXT,              -- 'admin' | 'mobile'
  app_version TEXT,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON client_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_platform ON client_errors (platform);

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

-- Any client (including pre-auth, e.g. a failed login) may report an error.
-- This is an intentional write-only-for-clients surface: there is no SELECT
-- grant to anon/authenticated, so no one can read the log back except admins.
-- The table holds only error telemetry, never used as an app data source.
CREATE POLICY "Anyone can report client errors"
  ON client_errors FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can read the error log.
CREATE POLICY "Admins can read client errors"
  ON client_errors FOR SELECT USING (is_admin());

-- Optional retention helper: call from a scheduled job to keep the table small.
CREATE OR REPLACE FUNCTION public.purge_client_errors(p_keep_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted INTEGER;
BEGIN
  DELETE FROM client_errors WHERE created_at < NOW() - (p_keep_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
