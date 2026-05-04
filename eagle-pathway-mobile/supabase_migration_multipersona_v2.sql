-- ============================================================
-- MULTI-PERSONA REFACTOR MIGRATION
-- Fixes: roles normalization, RLS trust, lazy profile creation
-- ============================================================

-- ─── STEP 1: CREATE user_roles TABLE ─────────────────────────────────────
-- Source of truth for user roles (normalized, scalable)

CREATE TABLE IF NOT EXISTS user_roles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('student', 'parent', 'tutor', 'admin')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS: User can view their own roles, admins can view all
CREATE POLICY "Users can view own roles" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id OR (
    EXISTS (SELECT 1 FROM user_roles ur 
    JOIN users u ON u.id = ur.user_id 
    WHERE u.id = auth.uid() AND ur.role = 'admin')
  ));

-- RLS: Only allow insert if user doesn't already have this role
CREATE POLICY "Users can insert own roles" ON user_roles 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (
      EXISTS (SELECT 1 FROM user_roles ur 
      JOIN users u ON u.id = ur.user_id 
      WHERE u.id = auth.uid() AND ur.role = 'admin')
    )
  );


-- ─── STEP 2: MIGRATE EXISTING ROLES DATA ─────────────────────────────────
-- Move data from users.roles array to user_roles table

INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  u.id,
  unnest(u.roles) AS role,
  u.created_at
FROM users u
WHERE u.roles IS NOT NULL 
  AND array_length(u.roles, 1) > 0
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify migration
SELECT 'Migration result:' AS info, 
       (SELECT COUNT(*) FROM user_roles) AS user_roles_count,
       (SELECT COUNT(*) FROM users u WHERE u.roles IS NOT NULL) AS users_with_roles;


-- ─── STEP 3: REPLACE is_admin() FUNCTION ───────────────────────────────
-- Now checks user_roles table instead of users.active_role

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── STEP 4: HELPER FUNCTIONS ────────────────────────────────────────────
-- Check if user has specific role (source of truth for RLS)

CREATE OR REPLACE FUNCTION public.has_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── STEP 5: LAZY PROFILE CREATION TRIGGER ─────────────────────────────
-- Creates tutor/parent profiles on-demand when user switches to that role

CREATE OR REPLACE FUNCTION public.handle_role_switch()
RETURNS TRIGGER AS $$
BEGIN
  -- If switching to tutor, create tutor profile if not exists
  IF NEW.role = 'tutor' THEN
    INSERT INTO tutors (user_id, bio, is_verified)
    VALUES (NEW.user_id, '', FALSE)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- If switching to parent, ensure parent link capability exists
  -- (add parent_students table if needed)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role switches
DROP TRIGGER IF EXISTS role_switch_trigger ON user_roles;
CREATE TRIGGER role_switch_trigger
AFTER INSERT ON user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_role_switch();


-- ─── STEP 6: CLEAN UP users TABLE ──────────────────────────────────────
-- Keep roles/active_role for UI backward compatibility
-- But RLS should use user_roles table instead

-- Note: We keep columns for now to avoid breaking UI
-- Full cleanup can be done after frontend updates


-- ─── STEP 7: DROP OLD MIGRATION IF EXISTS ─────────────────────────────────
DROP TABLE IF EXISTS user_roles_old;