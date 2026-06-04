-- =========================================================================
-- NOTIFICATION PREFERENCES
-- Persists each user's notification toggles (previously local-only useState in
-- SettingsScreen that reset on restart and affected nothing). Stored server-side
-- so they survive reinstall and can be honored by push delivery later.
-- =========================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  session_reminders     BOOLEAN NOT NULL DEFAULT TRUE,
  scholarship_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
  document_updates      BOOLEAN NOT NULL DEFAULT TRUE,
  message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
