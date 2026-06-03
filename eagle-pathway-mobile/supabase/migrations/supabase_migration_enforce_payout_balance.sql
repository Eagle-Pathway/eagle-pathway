-- =========================================================================
-- SERVER-AUTHORITATIVE PAYOUT CEILING
--
-- Problem: requestPayout() trusts a client-supplied amount. A tutor can request
-- any figure; the only backstop is manual admin review.
--
-- Fix: a BEFORE INSERT trigger caps the requested amount at the tutor's
-- withdrawable balance, computed server-side as:
--
--   earned  = SUM(total_amount - platform_fee) over the tutor's bookings that
--             are status='completed' AND have an APPROVED 'tutor_booking' payment
--             (never pay out money the platform hasn't actually collected)
--   pledged = SUM(amount) over the tutor's payouts already pending/processing/paid
--   available = earned - pledged
--
-- SECURITY DEFINER because the balance reads `payments` rows the requesting
-- tutor cannot see under RLS.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.enforce_payout_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_earned NUMERIC;
  v_pledged NUMERIC;
  v_available NUMERIC;
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payout amount must be positive.';
  END IF;

  SELECT COALESCE(SUM(b.total_amount - b.platform_fee), 0)
    INTO v_earned
    FROM public.bookings b
   WHERE b.tutor_id = NEW.tutor_id
     AND b.status = 'completed'
     AND EXISTS (
       SELECT 1 FROM public.payments p
        WHERE p.reference_id = b.id
          AND p.payment_type = 'tutor_booking'
          AND p.status = 'approved'
     );

  SELECT COALESCE(SUM(tp.amount), 0)
    INTO v_pledged
    FROM public.tutor_payouts tp
   WHERE tp.tutor_id = NEW.tutor_id
     AND tp.status IN ('pending', 'processing', 'completed');

  v_available := v_earned - v_pledged;

  IF NEW.amount > v_available THEN
    RAISE EXCEPTION 'Payout of % exceeds withdrawable balance (available: %).', NEW.amount, v_available
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_enforce_payout_balance ON public.tutor_payouts;
CREATE TRIGGER tr_enforce_payout_balance
  BEFORE INSERT ON public.tutor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payout_balance();
