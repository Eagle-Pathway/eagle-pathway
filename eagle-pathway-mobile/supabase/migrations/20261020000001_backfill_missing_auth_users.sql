-- ==============================================================================
-- Migration: One-Time Safe Backfill of 254 Confirmed Users from auth.users
-- Target: public.users & public.user_roles
-- ==============================================================================

BEGIN;

-- 1. Ensure phone column is nullable (required for Google OAuth users who don't have a phone initially)
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. Identify candidate users and deduplicate phone numbers against existing users
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
    COALESCE(NULLIF(TRIM(au.raw_user_meta_data->>'role'), ''), 'student')::user_role AS role,
    COALESCE(
      NULLIF(TRIM(au.raw_user_meta_data->>'avatar_url'), ''),
      NULLIF(TRIM(au.raw_user_meta_data->>'picture'), '')
    ) AS avatar_url,
    au.created_at,
    COALESCE(au.updated_at, au.created_at) AS updated_at
  FROM auth.users au
  WHERE (au.confirmed_at IS NOT NULL OR au.email_confirmed_at IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM public.users pu WHERE pu.id = au.id
    )
),
deduped_candidates AS (
  SELECT 
    cu.*,
    -- Prevent unique constraint violation on public.users(phone)
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

-- 3. Synchronize roles into public.user_roles (cast user_role to text)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, u.role::text
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role::text
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

-- Verification check: Expected count is 1187
SELECT COUNT(*) AS total_public_users FROM public.users;
