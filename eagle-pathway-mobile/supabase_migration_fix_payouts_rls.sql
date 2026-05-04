-- Fix tutor_payouts RLS to allow admin to insert records

-- Drop existing insert policy
DROP POLICY IF EXISTS "Tutors can request payouts" ON tutor_payouts;

-- Recreate with admin exception
CREATE POLICY "Tutors can request payouts" ON tutor_payouts 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id)
    OR is_admin()
  );