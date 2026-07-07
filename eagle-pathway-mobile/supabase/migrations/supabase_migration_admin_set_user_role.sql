-- =========================================================================
-- ADMIN ROLE MANAGEMENT
--
-- There was no way to change a user's role from the dashboard — it required
-- manual SQL, and (as we learned) admin identity lives in THREE places that
-- must stay in sync: users.role, users.roles/active_role, and user_roles.
--
-- This SECURITY DEFINER RPC updates all three atomically, admin-only. It runs as
-- owner but auth.uid() still resolves to the calling admin, so the
-- protect_user_roles trigger (which permits role changes when is_admin()) allows
-- the update.
-- =========================================================================

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

  -- Make p_role the primary/active role and ensure it's in the roles array
  -- (additive — existing personas are kept).
  UPDATE public.users
  SET role = p_role::user_role,
      active_role = p_role,
      roles = (SELECT array_agg(DISTINCT x) FROM unnest(COALESCE(roles, ARRAY[]::text[]) || ARRAY[p_role]) AS x)
  WHERE id = p_user_id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT p_user_id, p_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
