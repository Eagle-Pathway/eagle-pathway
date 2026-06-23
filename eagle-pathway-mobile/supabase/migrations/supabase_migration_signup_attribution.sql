-- Signup attribution for influencer and campaign-driven growth.
--
-- Stores the first-touch referral/UTM values on users so the admin dashboard
-- can connect audience pushes to signups, applications, and payments.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS signup_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS first_landing_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_signup_source
  ON public.users(signup_source);

CREATE INDEX IF NOT EXISTS idx_users_referral_code
  ON public.users(referral_code);

CREATE INDEX IF NOT EXISTS idx_users_utm_campaign
  ON public.users(utm_campaign);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
BEGIN
  INSERT INTO public.users (
    id,
    full_name,
    email,
    roles,
    active_role,
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
