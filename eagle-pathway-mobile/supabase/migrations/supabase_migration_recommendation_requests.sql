-- =========================================================================
-- RECOMMENDATION LETTER TRACKER
-- Lets a student track the recommendation/reference letters they've asked
-- referees for: who they asked, the relationship, and whether it's been
-- received. Optionally links to the uploaded letter (documents row).
-- =========================================================================

CREATE TABLE IF NOT EXISTS recommendation_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_name  TEXT NOT NULL,
  referee_email TEXT,
  referee_phone TEXT,
  relationship  TEXT,                                   -- e.g. "Professor", "Manager"
  status        TEXT NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested', 'received', 'declined')),
  notes         TEXT,
  document_id   UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recommendation_requests_student
  ON recommendation_requests (student_id, created_at DESC);

ALTER TABLE recommendation_requests ENABLE ROW LEVEL SECURITY;

-- Students own their own requests; admins can read/manage for support.
CREATE POLICY "Students manage own recommendation requests"
  ON recommendation_requests FOR ALL
  USING (auth.uid() = student_id OR is_admin())
  WITH CHECK (auth.uid() = student_id OR is_admin());

CREATE TRIGGER update_recommendation_requests_updated_at
  BEFORE UPDATE ON recommendation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
