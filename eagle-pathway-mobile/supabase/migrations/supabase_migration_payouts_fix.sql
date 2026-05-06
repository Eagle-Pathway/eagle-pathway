-- Add missing reference_number column to tutor_payouts

ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Fix RLS - allow admin to insert
DROP POLICY IF EXISTS "Tutors can request payouts" ON tutor_payouts;
CREATE POLICY "Tutors can request payouts" ON tutor_payouts 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id)
    OR is_admin()
  );