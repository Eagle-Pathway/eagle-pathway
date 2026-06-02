-- =========================================================================
-- SERVER-AUTHORITATIVE BOOKING PRICING
--
-- Problem: createBooking() trusts total_amount and platform_fee computed on the
-- client (BookingScreen). A tampered client can insert a booking with
-- total_amount = 0 (or any value). RLS lets a student insert their own booking,
-- so nothing stops mispriced rows.
--
-- Fix: a BEFORE INSERT/UPDATE trigger recomputes both amounts from the source of
-- truth (tutors.hourly_rate) and the booked duration, ignoring whatever the
-- client supplied. The fee rate matches PLATFORM_FEE_RATE (10%) in the app, so
-- legitimate clients see identical numbers.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.enforce_booking_amounts()
RETURNS TRIGGER AS $$
DECLARE
  v_rate INTEGER;
  v_duration NUMERIC;
BEGIN
  SELECT hourly_rate INTO v_rate FROM public.tutors WHERE id = NEW.tutor_id;
  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Cannot price booking: unknown tutor %', NEW.tutor_id;
  END IF;

  -- Duration must be positive; default to 1 hour if missing.
  v_duration := COALESCE(NEW.duration_hours, 1);
  IF v_duration <= 0 THEN
    RAISE EXCEPTION 'Booking duration must be positive.';
  END IF;

  -- Server is authoritative: overwrite client-supplied amounts.
  NEW.platform_fee := ROUND(v_rate * v_duration * 0.10);
  NEW.total_amount := ROUND(v_rate * v_duration) + NEW.platform_fee;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enforce_booking_amounts ON public.bookings;
CREATE TRIGGER tr_enforce_booking_amounts
  BEFORE INSERT OR UPDATE OF tutor_id, duration_hours, total_amount, platform_fee
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_amounts();
