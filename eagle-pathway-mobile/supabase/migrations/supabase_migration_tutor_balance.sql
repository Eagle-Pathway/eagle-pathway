-- =========================================================================
-- AUTHORITATIVE TUTOR WITHDRAWABLE BALANCE
--
-- The mobile UI showed a balance computed as 85% of (hourly_rate x total_sessions)
-- minus in-flight payouts. But the payout-ceiling trigger
-- (enforce_payout_balance) allows withdrawals only up to:
--   earned  = SUM(total_amount - platform_fee) over the tutor's COMPLETED bookings
--             that have an APPROVED 'tutor_booking' payment
--   pledged = SUM(amount) over payouts already pending/processing/completed
-- So the UI could show money the DB would then reject.
--
-- This RPC returns the SAME number the trigger enforces, so the UI and the DB
-- agree. SECURITY DEFINER because it reads `payments` rows a tutor can't see
-- under RLS; it only ever aggregates the *calling* tutor's own bookings
-- (scoped by auth.uid()) and returns sums, never row data.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_tutor_balance()
RETURNS JSONB AS $$
DECLARE
  v_tutor_id UUID;
  v_earned NUMERIC;
  v_pledged NUMERIC;
BEGIN
  SELECT id INTO v_tutor_id FROM public.tutors WHERE user_id = auth.uid();
  IF v_tutor_id IS NULL THEN
    RETURN jsonb_build_object('earned', 0, 'pledged', 0, 'available', 0, 'is_tutor', false);
  END IF;

  SELECT COALESCE(SUM(b.total_amount - b.platform_fee), 0)
    INTO v_earned
    FROM public.bookings b
   WHERE b.tutor_id = v_tutor_id
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
   WHERE tp.tutor_id = v_tutor_id
     AND tp.status IN ('pending', 'processing', 'completed');

  RETURN jsonb_build_object(
    'earned', v_earned,
    'pledged', v_pledged,
    'available', GREATEST(v_earned - v_pledged, 0),
    'is_tutor', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION public.get_tutor_balance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tutor_balance() TO authenticated;
