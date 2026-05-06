-- ============================================================
-- MULTI-PERSONA REFACTOR MIGRATION
-- Fixes: roles normalization, RLS trust, lazy profile creation
-- ============================================================

-- ─── STEP 1: CREATE user_roles TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('student', 'parent', 'tutor', 'admin')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id OR (
    EXISTS (SELECT 1 FROM user_roles ur 
    JOIN users u ON u.id = ur.user_id 
    WHERE u.id = auth.uid() AND ur.role = 'admin')
  ));

CREATE POLICY "Users can insert own roles" ON user_roles 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (
      EXISTS (SELECT 1 FROM user_roles ur 
      JOIN users u ON u.id = ur.user_id 
      WHERE u.id = auth.uid() AND ur.role = 'admin')
    )
  );

-- ─── STEP 2: MIGRATE EXISTING ROLES DATA ─────────────────────────────────
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  u.id,
  unnest(u.roles) AS role,
  u.created_at
FROM users u
WHERE u.roles IS NOT NULL 
  AND array_length(u.roles, 1) > 0
ON CONFLICT (user_id, role) DO NOTHING;

SELECT 'Migration result:' AS info, 
       (SELECT COUNT(*) FROM user_roles) AS user_roles_count,
       (SELECT COUNT(*) FROM users u WHERE u.roles IS NOT NULL) AS users_with_roles;

-- ─── STEP 3: REPLACE is_admin() FUNCTION ───────────────────────────────
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
CREATE OR REPLACE FUNCTION public.handle_role_switch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'tutor' THEN
    INSERT INTO tutors (user_id, bio, is_verified)
    VALUES (NEW.user_id, '', FALSE)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS role_switch_trigger ON user_roles;
CREATE TRIGGER role_switch_trigger
AFTER INSERT ON user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_role_switch();