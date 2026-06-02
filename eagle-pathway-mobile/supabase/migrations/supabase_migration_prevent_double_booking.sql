-- =========================================================================
-- PREVENT TUTOR DOUBLE-BOOKING
--
-- Problem: createBooking() does nothing to stop two students booking the same
-- tutor for the same date/time. Nothing in the schema enforces slot uniqueness,
-- so a tutor can be double-booked.
--
-- Fix: a partial unique index on (tutor_id, session_date, session_time) that
-- applies only to ACTIVE bookings (pending/confirmed). Cancelled/completed
-- bookings don't hold the slot, so a freed slot can be re-booked. Sessions are
-- fixed at 1 hour today, so an exact slot match is sufficient; if variable
-- durations are introduced later this should become a range/overlap check.
-- =========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_slot
  ON public.bookings (tutor_id, session_date, session_time)
  WHERE status IN ('pending', 'confirmed');
