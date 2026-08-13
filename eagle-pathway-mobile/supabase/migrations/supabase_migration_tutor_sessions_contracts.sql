-- Migration: Tutor Responsibility Agreements & Live Session Logs
-- Author: Eagle Pathway Engineering
-- Description: Adds tables and RLS security policies for tutor responsibility contracts and live session clock-in/clock-out tracking.

-- 1. TUTOR RESPONSIBILITY AGREEMENTS
CREATE TABLE IF NOT EXISTS tutor_agreements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id            UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responsibilities    TEXT NOT NULL,
  tutor_signed        BOOLEAN NOT NULL DEFAULT FALSE,
  tutor_signed_at     TIMESTAMPTZ,
  parent_signed       BOOLEAN NOT NULL DEFAULT FALSE,
  parent_signed_at    TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'terminated')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for tutor_agreements
ALTER TABLE tutor_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view own agreements" ON tutor_agreements
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

CREATE POLICY "Parties can create agreements" ON tutor_agreements
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

CREATE POLICY "Parties can update own agreements" ON tutor_agreements
  FOR UPDATE USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

-- 2. LIVE TUTOR SESSION LOGS (Clock-In / Clock-Out)
CREATE TABLE IF NOT EXISTS tutor_session_logs (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id                    UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time                    TIMESTAMPTZ,
  tutor_start_confirmed       BOOLEAN NOT NULL DEFAULT TRUE,
  student_start_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
  student_start_confirmed_at  TIMESTAMPTZ,
  tutor_end_confirmed         BOOLEAN NOT NULL DEFAULT FALSE,
  tutor_end_confirmed_at      TIMESTAMPTZ,
  student_end_confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
  student_end_confirmed_at    TIMESTAMPTZ,
  duration_minutes            INTEGER DEFAULT 0,
  hourly_rate                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_calculated_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for tutor_session_logs
ALTER TABLE tutor_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view own session logs" ON tutor_session_logs
  FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

CREATE POLICY "Parties can create session logs" ON tutor_session_logs
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

CREATE POLICY "Parties can update session logs" ON tutor_session_logs
  FOR UPDATE USING (
    auth.uid() = student_id OR 
    auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR 
    is_admin()
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agreements_booking ON tutor_agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_booking ON tutor_session_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_tutor ON tutor_session_logs(tutor_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_student ON tutor_session_logs(student_id);
