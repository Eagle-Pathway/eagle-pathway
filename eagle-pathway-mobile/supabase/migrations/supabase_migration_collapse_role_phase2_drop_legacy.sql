-- =========================================================================
-- ROLE MODEL COLLAPSE — PHASE 2 (DESTRUCTIVE) — DO NOT APPLY YET
--
-- ⚠️  APPLY ONLY WHEN ALL OF THESE ARE TRUE:
--   1. PHASE 1 backfill has been applied and verified (0 rows mismatched).
--   2. The matching app build is deployed (uses getUserRole()/users.role).
--   3. auth.ts createProfile NO LONGER inserts `roles`/`active_role`
--      (remove those two mirror lines — once columns are dropped, inserting
--       them errors). See the coordinated code change in the PR description.
--   4. Ideally tested first on a Supabase branch / staging clone — this DROPs
--      columns and rewrites SECURITY DEFINER functions + RLS policies.
--
-- This converts every remaining reader/writer of users.roles[] and
-- users.active_role over to users.role, then drops the two legacy columns.
-- After this, ONE role per account is the only model.
-- =========================================================================

BEGIN;

-- ─── 1. admin_set_user_role: stop writing the legacy mirrors ──────────────
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin role required.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('student', 'parent', 'tutor', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role USING ERRCODE = '22023';
  END IF;

  UPDATE public.users SET role = p_role WHERE id = p_user_id;

  -- user_roles stays the source of truth for is_admin(); keep it in sync.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- ─── 2. protect_user_roles: guard the single role column only ─────────────
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can change a user role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. parent_student_links policies: use is_admin() (reads user_roles) ──
DROP POLICY IF EXISTS "Parents can view linked students" ON public.parent_student_links;
CREATE POLICY "Parents can view linked students" ON public.parent_student_links FOR SELECT USING (
  parent_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can view all links" ON public.parent_student_links;
CREATE POLICY "Admins can view all links" ON public.parent_student_links FOR SELECT USING (
  public.is_admin()
);

-- ─── 4. get_user_conversations: read role (keep OUT column name stable) ───
-- Returns u.role under the existing `active_role` output column so the mobile
-- chat client keeps working without a signature change.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  roles TEXT[],
  active_role TEXT,
  last_message TEXT,
  last_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (
      CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
      CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END
    )
      m.sender_id, m.recipient_id, m.content, m.created_at, m.is_read
    FROM public.messages m
    WHERE m.sender_id = p_user_id OR m.recipient_id = p_user_id
    ORDER BY
      CASE WHEN sender_id < recipient_id THEN sender_id ELSE recipient_id END,
      CASE WHEN sender_id < recipient_id THEN recipient_id ELSE sender_id END,
      m.created_at DESC
  ),
  unread_counts AS (
    SELECT m.sender_id as contact_id, COUNT(*) as count
    FROM public.messages m
    WHERE m.recipient_id = p_user_id AND m.is_read = false
    GROUP BY m.sender_id
  )
  SELECT
    u.id as other_user_id,
    u.full_name,
    u.avatar_url,
    ARRAY[u.role]::TEXT[] as roles,   -- legacy shape, single role
    u.role as active_role,            -- now sourced from the canonical column
    lm.content as last_message,
    lm.created_at as last_time,
    COALESCE(uc.count, 0) as unread_count
  FROM latest_messages lm
  JOIN public.users u ON u.id = (CASE WHEN lm.sender_id = p_user_id THEN lm.recipient_id ELSE lm.sender_id END)
  LEFT JOIN unread_counts uc ON uc.contact_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. get_dashboard_summary: demographics from role ─────────────────────
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

  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_tutors_pending FROM public.tutors WHERE is_verified = FALSE;
  SELECT COUNT(*) INTO v_active_scholarships FROM public.scholarships WHERE is_active = TRUE;
  SELECT COUNT(*) INTO v_bookings FROM public.bookings;
  SELECT COUNT(*) INTO v_applications_pending FROM public.applications WHERE status NOT IN ('accepted', 'rejected');

  -- Demographics now from the single canonical role.
  SELECT COUNT(*) INTO v_students FROM public.users WHERE role = 'student';
  SELECT COUNT(*) INTO v_tutors   FROM public.users WHERE role = 'tutor';
  SELECT COUNT(*) INTO v_admins   FROM public.users WHERE role = 'admin';

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

REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO service_role;

-- ─── 6. Drop the legacy columns ───────────────────────────────────────────
ALTER TABLE public.users DROP COLUMN IF EXISTS roles;
ALTER TABLE public.users DROP COLUMN IF EXISTS active_role;

COMMIT;

-- Post-apply sanity checks:
--   SELECT role, COUNT(*) FROM public.users GROUP BY role;          -- distribution sane
--   SELECT public.get_dashboard_summary();                          -- as an admin
--   -- confirm no object still references the dropped columns:
--   SELECT p.proname FROM pg_proc p
--   WHERE pg_get_functiondef(p.oid) ~* '\\m(active_role|roles)\\M'
--     AND p.pronamespace = 'public'::regnamespace;
