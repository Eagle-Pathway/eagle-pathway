-- =========================================================================
-- DEDUPE EXISTING DOUBLE-BOOKINGS, THEN CREATE THE GUARD INDEX
--
-- supabase_migration_prevent_double_booking.sql failed on live data because
-- duplicate ACTIVE bookings already existed (an accidental multi-tap created
-- several identical bookings for one tutor/slot). A unique index can't be
-- created until the existing duplicates are resolved.
--
-- This migration is self-healing and idempotent:
--   1. For each (tutor_id, session_date, session_time) group of active bookings,
--      keep exactly one — prefer 'confirmed', else the earliest created
--      (first-come-first-served) — and demote the rest to 'cancelled'.
--   2. Create the partial unique index (no-op if it already exists).
--
-- Note: updating only status/notes does not fire enforce_booking_amounts
-- (which triggers on tutor_id/duration/amount columns), so prices are untouched.
-- =========================================================================

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tutor_id, session_date, session_time
      ORDER BY (status = 'confirmed') DESC, created_at ASC
    ) AS rn
  FROM public.bookings
  WHERE status IN ('pending', 'confirmed')
)
UPDATE public.bookings b
SET
  status = 'cancelled',
  notes = COALESCE(NULLIF(b.notes, ''), '') ||
          CASE WHEN COALESCE(b.notes, '') = '' THEN '' ELSE ' ' END ||
          '[auto-cancelled: duplicate slot, superseded]'
FROM ranked r
WHERE b.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_slot
  ON public.bookings (tutor_id, session_date, session_time)
  WHERE status IN ('pending', 'confirmed');
