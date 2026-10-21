-- ==============================================================================
-- Migration: Fail-Safe handle_new_user Trigger & User Profile Recovery
-- File: supabase/migrations/20261021000001_fix_handle_new_user_fail_safe.sql
-- Description: Makes handle_new_user fail-safe with EXCEPTION isolation,
--              explicit user_role enum casting, safe phone deduplication,
--              and backfills missing public profiles.
-- ==============================================================================

BEGIN;

-- 1. Ensure phone column is nullable (required for Google OAuth and email signups)
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. Create or replace the fail-safe handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_role_text TEXT;
  v_role_enum public.user_role;
  v_avatar_url TEXT;
BEGIN
  -- Safe full name extraction
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
    'Eagle User'
  );

  -- Safe role extraction with valid fallback
  v_role_text := LOWER(COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'student'));
  IF v_role_text NOT IN ('student', 'parent', 'tutor', 'admin', 'archived') THEN
    v_role_text := 'student';
  END IF;
  v_role_enum := v_role_text::public.user_role;

  -- Safe avatar extraction
  v_avatar_url := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- Safe phone extraction: deduplicate against existing phone numbers to prevent unique constraint crash
  v_phone := NULLIF(TRIM(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone')), '');
  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.users WHERE phone = v_phone AND id <> NEW.id) THEN
    v_phone := NULL;
  END IF;

  -- Insert or update public.users with explicit user_role cast
  INSERT INTO public.users (
    id,
    full_name,
    email,
    phone,
    role,
    active_role,
    avatar_url
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_phone,
    v_role_enum,
    v_role_enum,
    v_avatar_url
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE 
      WHEN public.users.full_name IS NULL OR public.users.full_name = 'Eagle User' 
      THEN EXCLUDED.full_name 
      ELSE public.users.full_name 
    END,
    email = EXCLUDED.email,
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
    active_role = COALESCE(public.users.active_role, EXCLUDED.active_role);

  -- Synchronize public.user_roles (cast user_role to text)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role_text)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Prevent trigger failure from aborting user registration in auth.users
  RAISE WARNING 'handle_new_user error for user % (%): %', NEW.id, NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Re-attach the trigger cleanly to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. One-time self-healing backfill for any auth users currently missing in public.users
WITH candidate_users AS (
  SELECT 
    au.id,
    COALESCE(
      NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
      split_part(au.email, '@', 1),
      'Eagle User'
    ) AS full_name,
    au.email,
    NULLIF(TRIM(COALESCE(au.phone, au.raw_user_meta_data->>'phone')), '') AS raw_phone,
    CASE 
      WHEN LOWER(COALESCE(NULLIF(TRIM(au.raw_user_meta_data->>'role'), ''), 'student')) IN ('student', 'parent', 'tutor', 'admin', 'archived')
      THEN LOWER(COALESCE(NULLIF(TRIM(au.raw_user_meta_data->>'role'), ''), 'student'))
      ELSE 'student'
    END::public.user_role AS role,
    COALESCE(
      NULLIF(TRIM(au.raw_user_meta_data->>'avatar_url'), ''),
      NULLIF(TRIM(au.raw_user_meta_data->>'picture'), '')
    ) AS avatar_url,
    au.created_at,
    COALESCE(au.updated_at, au.created_at) AS updated_at
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  )
),
deduped_candidates AS (
  SELECT 
    cu.*,
    CASE 
      WHEN cu.raw_phone IS NULL THEN NULL
      WHEN EXISTS (SELECT 1 FROM public.users pu WHERE pu.phone = cu.raw_phone) THEN NULL
      WHEN ROW_NUMBER() OVER (PARTITION BY cu.raw_phone ORDER BY cu.created_at ASC) > 1 THEN NULL
      ELSE cu.raw_phone
    END AS safe_phone
  FROM candidate_users cu
)
INSERT INTO public.users (
  id,
  full_name,
  email,
  phone,
  role,
  active_role,
  avatar_url,
  created_at,
  updated_at
)
SELECT 
  id,
  full_name,
  email,
  safe_phone,
  role,
  role AS active_role,
  avatar_url,
  created_at,
  updated_at
FROM deduped_candidates
ON CONFLICT (id) DO NOTHING;

-- 5. Synchronize user_roles for any missing entries (cast user_role to text)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, u.role::text
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role::text
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- 6. Verification check: returns updated count
SELECT COUNT(*) AS total_public_users FROM public.users;
