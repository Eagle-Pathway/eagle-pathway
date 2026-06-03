-- =========================================================================
-- FIX get_dashboard_summary() MISSING FIELDS
--
-- The deployed function (from supabase_migration_secure_dashboard_summary.sql)
-- has three defects that make the admin overview under-report:
--   1. total_users is computed but never included in the returned object.
--   2. v_active_scholarships is declared but never SELECTed -> returns null.
--   3. v_bookings is declared but never SELECTed -> returns null.
-- Net effect: the "Total Users", "Active Scholarships" and "Bookings" cards
-- on the overview all read 0.
--
-- This re-creates the function with all counts computed and returned, keeping
-- the is_admin() authorization guard and the locked-down grants.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
  v_total_users BIGINT;
  v_tutors_pending BIGINT;
  v_active_scholarships BIGINT;
  v_bookings BIGINT;
  v_applications_pending BIGINT;
  v_students BIGINT;
  v_tutors BIGINT;
  v_admins BIGINT;
  v_pending_docs BIGINT;
  v_pending_payments BIGINT;
  v_unassigned_apps BIGINT;
  v_pending_services BIGINT;
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin role required.' USING ERRCODE = '42501';
  END IF;

  -- 1. Core counters
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_tutors_pending FROM public.tutors WHERE is_verified = FALSE;
  SELECT COUNT(*) INTO v_active_scholarships FROM public.scholarships WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_bookings FROM public.bookings;
  SELECT COUNT(*) INTO v_applications_pending FROM public.applications WHERE status NOT IN ('accepted', 'rejected');

  -- 2. Demographics (aggregates both active_role and role array memberships)
  SELECT COUNT(*) INTO v_students FROM public.users WHERE active_role = 'student' OR 'student' = ANY(roles);
  SELECT COUNT(*) INTO v_tutors FROM public.users WHERE active_role = 'tutor' OR 'tutor' = ANY(roles);
  SELECT COUNT(*) INTO v_admins FROM public.users WHERE active_role = 'admin' OR 'admin' = ANY(roles);

  -- 3. Operations queue indicators
  SELECT COUNT(*) INTO v_pending_docs FROM public.documents WHERE status = 'pending';
  SELECT COUNT(*) INTO v_pending_payments FROM public.payments WHERE status = 'pending';
  SELECT COUNT(*) INTO v_unassigned_apps FROM public.applications WHERE consultant_id IS NULL AND status NOT IN ('accepted', 'rejected');
  SELECT COUNT(*) INTO v_pending_services FROM public.service_requests WHERE status IN ('pending', 'reviewing');

  v_result := jsonb_build_object(
    'total_users', v_total_users,
    'tutors_pending', v_tutors_pending,
    'active_scholarships', v_active_scholarships,
    'bookings', v_bookings,
    'applications_pending', v_applications_pending,
    'students_count', v_students,
    'tutors_count', v_tutors,
    'admins_count', v_admins,
    'pending_docs', v_pending_docs,
    'pending_payments', v_pending_payments,
    'unassigned_apps', v_unassigned_apps,
    'pending_services', v_pending_services
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Preserve the locked-down grants (admin-only via the in-function guard).
REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO service_role;
