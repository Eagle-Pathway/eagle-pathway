-- =========================================================================
-- DURABLE EXECUTE GRANT FOR public.is_admin()
--
-- is_admin() is now the single source of truth for admin-ness: RLS policies use
-- it, and the admin web AuthGuard calls it as an RPC instead of reading
-- users.roles/active_role directly. Make the EXECUTE grant explicit so a future
-- `REVOKE ... FROM PUBLIC` (as was correctly done for get_dashboard_summary)
-- cannot silently break admin login.
--
-- Safe to expose: is_admin() takes no args and checks only the CALLER's own
-- rows via auth.uid(), so it reveals nothing beyond "are *you* an admin".
-- =========================================================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
