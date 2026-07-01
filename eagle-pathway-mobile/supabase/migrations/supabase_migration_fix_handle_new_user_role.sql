-- =========================================================================
-- FIX: handle_new_user did not set the canonical users.role column.
--
-- The on_auth_user_created trigger creates the public.users row at sign-up
-- from auth metadata, but it only wrote the legacy roles[]/active_role mirrors
-- and left `role` at its column DEFAULT ('student'). Because the trigger
-- pre-creates the profile, the client createProfile() (which DOES set role) is
-- skipped, so EVERY tutor/parent who signs up via the app ends up with
-- role='student'. getUserRole() reads users.role first, so those accounts are
-- treated as students throughout the app.
--
-- This realigns the trigger to set `role` alongside the legacy mirrors. It is
-- idempotent (CREATE OR REPLACE) and non-destructive — the trigger binding is
-- unchanged. Safe to run before or after PHASE 1 backfill.
--
-- NOTE: This is the PRE-phase-2 version (legacy columns still exist). When the
-- phase-2 drop is applied, that migration MUST also drop the roles/active_role
-- lines from this function or the trigger will error on the missing columns.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
BEGIN
  INSERT INTO public.users (
    id,
    full_name,
    email,
    role,                 -- canonical single role (was previously left at default)
    roles,                -- legacy mirror — dropped in phase 2
    active_role,          -- legacy mirror — dropped in phase 2
    phone,
    referral_code,
    signup_source,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    first_landing_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    requested_role::user_role,   -- role column is the user_role ENUM
    ARRAY[requested_role],
    requested_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'referral_code', ''),
    NULLIF(NEW.raw_user_meta_data->>'signup_source', ''),
    NULLIF(NEW.raw_user_meta_data->>'utm_source', ''),
    NULLIF(NEW.raw_user_meta_data->>'utm_medium', ''),
    NULLIF(NEW.raw_user_meta_data->>'utm_campaign', ''),
    NULLIF(NEW.raw_user_meta_data->>'utm_content', ''),
    NULLIF(NEW.raw_user_meta_data->>'first_landing_url', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill any already-affected accounts (tutor/parent stored as student).
-- Uses the trusted legacy scalar, same logic as the phase-1 backfill.
-- users.role writes are guarded by tr_protect_user_roles (admin-only); disable
-- it for this one-time backfill since the SQL editor has no auth.uid() context.
ALTER TABLE public.users DISABLE TRIGGER tr_protect_user_roles;

UPDATE public.users
SET role = COALESCE(active_role, roles[1], 'student')::user_role
WHERE role::text IS DISTINCT FROM COALESCE(active_role, roles[1], 'student');

ALTER TABLE public.users ENABLE TRIGGER tr_protect_user_roles;
