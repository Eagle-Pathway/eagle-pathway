-- =========================================================================
-- FIX: Supabase Auth GoTrue 500 "Database error querying schema"
--
-- GoTrue (Supabase Auth service) throws a 500 internal server error during
-- authentication (signInWithPassword, listUsers) when text/token columns
-- in `auth.users` contain NULL instead of an empty string ('').
-- Go's sql scanner fails with "Scan error: converting NULL to string is unsupported".
--
-- Running this script replaces any NULL token/string values in auth.users with empty strings.
-- =========================================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');
