-- Migration: Atomic Tutor Slot Reservation RPC Procedure
-- Author: Eagle Pathway Core Engineering
-- Description: Prevents double-booking race conditions by locking and reserving tutor time slots atomically.

CREATE OR REPLACE FUNCTION reserve_tutor_slot(
  p_tutor_id UUID,
  p_student_id UUID,
  p_session_time TIMESTAMPTZ,
  p_subject TEXT DEFAULT 'General Tutoring',
  p_hourly_rate NUMERIC DEFAULT 400
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
  v_new_booking_id UUID;
BEGIN
  -- 1. Lock and check for existing active booking at the specified slot
  SELECT id INTO v_existing_id
  FROM bookings
  WHERE tutor_id = p_tutor_id
    AND session_time = p_session_time
    AND status NOT IN ('cancelled', 'rejected')
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SLOT_TAKEN',
      'message', 'This session time slot has already been booked by another student. Please select a different time.'
    );
  END IF;

  -- 2. Perform atomic booking insertion
  INSERT INTO bookings (
    tutor_id,
    student_id,
    session_time,
    subject,
    amount,
    status,
    created_at
  ) VALUES (
    p_tutor_id,
    p_student_id,
    p_session_time,
    p_subject,
    p_hourly_rate,
    'confirmed',
    NOW()
  ) RETURNING id INTO v_new_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'message', 'Session slot successfully reserved.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'DATABASE_ERROR',
    'message', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_tutor_slot TO authenticated, service_role;
