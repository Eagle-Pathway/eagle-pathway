-- ============================================================
-- EAGLE PATHWAY - SCHEMA PARITY CHECKLIST
-- Run this to verify schema state
-- ============================================================

-- Check 1: Core tables exist
SELECT 'CHECK 1: Core Tables' AS check_name,
       COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'users', 'user_roles', 'tutors', 'tutor_reviews', 'bookings',
  'service_requests', 'scholarships', 'applications', 'documents',
  'notifications', 'student_tasks', 'push_tokens', 'messages',
  'payments', 'tutor_payouts', 'parent_student_links', 'booking_ratings'
);

-- Check 2: users columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 3: user_roles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 4: tutor_payouts columns (should have reference_number after migration)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tutor_payouts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 5: RLS policies on tutor_payouts
SELECT policyname AS polname, cmd AS polcmd 
FROM pg_policies 
WHERE tablename = 'tutor_payouts';

-- Check 6: Helper functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('is_admin', 'has_role', 'update_updated_at_column');

-- Check 7: Triggers on users
SELECT tgname 
FROM pg_trigger 
WHERE tgrelid = 'users'::regclass;

-- Check 8: is_admin() implementation
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check 9: Tutor profile for current user exists
SELECT t.id, t.user_id, u.full_name 
FROM tutors t 
JOIN users u ON t.user_id = u.id 
WHERE u.phone = '+251932508910';

-- Check 10: student_tasks table - verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student_tasks' AND table_schema = 'public'
ORDER BY ordinal_position;