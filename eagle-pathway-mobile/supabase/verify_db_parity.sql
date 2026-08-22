-- ============================================================================
-- EAGLE PATHWAY — SUPABASE DATABASE PARITY CHECKER
-- File: supabase/verify_db_parity.sql
-- Description: Paste and RUN this query in your Supabase Dashboard SQL Editor
-- to cross-check your live database against the single master schema!
-- ============================================================================

SELECT 
  t.tablename AS "Table Name",
  CASE WHEN r.rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END AS "RLS Status",
  COALESCE(p.policy_count, 0) AS "Active Policies"
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN (
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
) r ON r.tablename = t.tablename
LEFT JOIN (
  SELECT tablename, COUNT(*) AS policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- RPC FUNCTION VERIFICATION
SELECT 
  routine_name AS "RPC Function Name",
  security_type AS "Security Type",
  data_type AS "Return Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'reserve_tutor_slot', 'check_ai_rate_limit', 'increment_sop_draft', 'get_approved_tutor_push_tokens')
ORDER BY routine_name;
