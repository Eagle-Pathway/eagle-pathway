-- PROTECT USER ROLES (ISSUE-16)
-- This migration prevents users from escalating their own privileges 
-- by adding a trigger that blocks non-admins from changing role-related columns.

-- 1. Create a function to protect sensitive columns
CREATE OR REPLACE FUNCTION public.protect_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is NOT an admin, prevent them from changing roles
  IF NOT public.is_admin() THEN
    -- Check if roles are being changed
    IF (OLD.role IS DISTINCT FROM NEW.role) OR 
       (OLD.roles IS DISTINCT FROM NEW.roles) OR 
       (OLD.active_role IS DISTINCT FROM NEW.active_role) THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can change user roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the users table
DROP TRIGGER IF EXISTS tr_protect_user_roles ON public.users;
CREATE TRIGGER tr_protect_user_roles
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_roles();

-- 3. Also Harden the RLS policy to be more explicit
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Note: The trigger above provides the actual column-level security.
