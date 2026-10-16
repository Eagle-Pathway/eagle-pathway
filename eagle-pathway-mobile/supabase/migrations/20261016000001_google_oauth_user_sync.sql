-- Migration: Improve handle_new_user trigger for Google OAuth and automatic user_roles synchronization
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Eagle User'
    ),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE 
      WHEN public.users.full_name IS NULL OR public.users.full_name = 'Eagle User' 
      THEN EXCLUDED.full_name 
      ELSE public.users.full_name 
    END,
    email = EXCLUDED.email;

  -- Ensure entry in public.user_roles (source of truth for roles)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
