-- =========================================================================
-- ROLE MODEL COLLAPSE — PHASE 1 (SAFE / ADDITIVE)
--
-- Target model: ONE role per account (Student | Tutor | Parent | Admin),
-- stored in users.role. The legacy multi-persona columns (users.roles[],
-- users.active_role) are now just mirrors and will be dropped in PHASE 2.
--
-- Why this backfill is needed: signup historically wrote roles[]/active_role
-- but NOT users.role, so role kept its column default ('student') for every
-- app-created account. A tutor/parent created in the app therefore has
-- role='student' even though active_role is correct. This realigns role to the
-- trusted scalar (active_role, then roles[1]).
--
-- Idempotent and safe to re-run. No columns dropped here.
-- =========================================================================

UPDATE public.users
SET role = COALESCE(active_role, roles[1], 'student')
WHERE role IS DISTINCT FROM COALESCE(active_role, roles[1], 'student');

-- role already has NOT NULL DEFAULT 'student' in the base schema; signup and the
-- admin_set_user_role RPC now both write it, so it stays authoritative going forward.

-- Verification (run manually, expect 0 rows):
--   SELECT id, role, active_role, roles FROM public.users
--   WHERE role IS DISTINCT FROM COALESCE(active_role, roles[1], 'student');
