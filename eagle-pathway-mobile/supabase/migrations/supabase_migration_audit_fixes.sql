-- =========================================================================
-- SYSTEMS SECURITY & PERFORMANCE HARDENING (AUDIT REFACTORS)
-- 1. Persona-Switching Trigger Fix
-- 2. Column-Level RLS Overwrite Protection (Tutors, Applications, Links)
-- 3. Database Indexes on Foreign Keys (Messages, Bookings, Applications, etc.)
-- 4. Server-Side Dashboard Summary RPC
-- =========================================================================

-- ─── 1. PERSONA-SWITCHING TRIGGER FIX ────────────────────────────────────
-- Allows normal users to switch active_role to a persona they already possess.
-- Prevents privilege escalation.
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Block any changes to the roles array or the legacy single role column (privilege escalation protection)
    IF (OLD.role IS DISTINCT FROM NEW.role) OR 
       (OLD.roles IS DISTINCT FROM NEW.roles) THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify user role list permissions.';
    END IF;

    -- Permit active_role updates, but only if the user actually possesses that role
    IF (OLD.active_role IS DISTINCT FROM NEW.active_role) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = NEW.id
          AND ur.role = NEW.active_role
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Cannot switch active persona to a role you do not possess.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS tr_protect_user_roles ON public.users;
CREATE TRIGGER tr_protect_user_roles
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_roles();


-- ─── 2. COLUMN-LEVEL WRITE SECURITY TRIGGERS ──────────────────────────────

-- A. Prevent non-admins from self-verifying tutor profiles
CREATE OR REPLACE FUNCTION public.protect_tutor_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify tutor verification status.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_tutor_verification ON public.tutors;
CREATE TRIGGER tr_protect_tutor_verification
  BEFORE UPDATE ON public.tutors
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_tutor_verification();


-- B. Prevent non-admins from changing application status to or from final admin decisions
CREATE OR REPLACE FUNCTION public.protect_application_status()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NOT public.is_admin() THEN
    IF NEW.status IN ('accepted', 'rejected')
       OR OLD.status IN ('accepted', 'rejected') THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify final scholarship application decisions.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_application_status ON public.applications;
CREATE TRIGGER tr_protect_application_status
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_application_status();


-- C. Prevent parents (or anyone other than the target student) from self-verifying links
CREATE OR REPLACE FUNCTION public.protect_parent_student_links()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) AND NEW.is_verified = TRUE AND NOT public.is_admin() THEN
    -- Check if the executor's UID matches the student being linked
    IF auth.uid() IS DISTINCT FROM NEW.student_id THEN
      RAISE EXCEPTION 'Unauthorized: Only the target student can verify a parent link request.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_parent_student_links ON public.parent_student_links;
CREATE TRIGGER tr_protect_parent_student_links
  BEFORE UPDATE ON public.parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_parent_student_links();


-- ─── 3. HIGH-FREQUENCY FOREIGN KEY DATABASE INDEXES ───────────────────────
-- PostgreSQL does not automatically index foreign keys. These indexes avoid sequential scans (SEQ SCAN).

CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_created ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_student_tutor ON public.bookings(student_id, tutor_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_application ON public.documents(application_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_student ON public.parent_student_links(parent_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON public.student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_payouts_tutor_id ON public.tutor_payouts(tutor_id);


-- ─── 4. SERVER-SIDE OVERVIEW ANALYTICS RPC ────────────────────────────────
-- Aggregates 12 client-side dashboard queries into a single database-side call.
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
  -- 1. Core counters
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_tutors_pending FROM public.tutors WHERE is_verified = FALSE;
  SELECT COUNT(*) INTO v_active_scholarships FROM public.scholarships WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_bookings FROM public.bookings;
  SELECT COUNT(*) INTO v_applications_pending FROM public.applications WHERE status != 'accepted';
  
  -- 2. Demographics (aggregates both active_role and role array memberships)
  SELECT COUNT(*) INTO v_students FROM public.users WHERE active_role = 'student' OR 'student' = ANY(roles);
  SELECT COUNT(*) INTO v_tutors FROM public.users WHERE active_role = 'tutor' OR 'tutor' = ANY(roles);
  SELECT COUNT(*) INTO v_admins FROM public.users WHERE active_role = 'admin' OR 'admin' = ANY(roles);
  
  -- 3. Operations queue indicators
  SELECT COUNT(*) INTO v_pending_docs FROM public.documents WHERE status = 'pending';
  SELECT COUNT(*) INTO v_pending_payments FROM public.payments WHERE status = 'pending';
  SELECT COUNT(*) INTO v_unassigned_apps FROM public.applications WHERE consultant_id IS NULL AND status NOT IN ('accepted', 'rejected');
  SELECT COUNT(*) INTO v_pending_services FROM public.service_requests WHERE status IN ('pending', 'reviewing');
  
  -- 4. Return formatted JSON response
  v_result := json_build_object(
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

-- Restrict execution to trusted server-side callers only
REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO service_role;
