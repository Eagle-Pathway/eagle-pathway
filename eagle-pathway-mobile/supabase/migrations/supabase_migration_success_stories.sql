-- =========================================================================
-- SUCCESS STORIES (admin-curated)
-- "How I won X scholarship" stories students can browse for trust + motivation.
-- Admin-curated only: students read published stories; admins manage all.
-- =========================================================================

CREATE TABLE IF NOT EXISTS success_stories (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name     TEXT NOT NULL,                 -- display name (may be an alias for privacy)
  avatar_url       TEXT,
  scholarship_name TEXT NOT NULL,
  scholarship_id   UUID REFERENCES scholarships(id) ON DELETE SET NULL,
  country          TEXT,
  country_flag     TEXT,
  year             INTEGER,
  quote            TEXT NOT NULL,                 -- short headline quote
  story            TEXT,                          -- longer body
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_stories_published ON success_stories (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_stories_scholarship ON success_stories (scholarship_id);

ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Anyone signed in sees published stories; admins see + manage everything.
CREATE POLICY "Published success stories are viewable"
  ON success_stories FOR SELECT TO authenticated
  USING (is_published OR is_admin());

CREATE POLICY "Admins manage success stories"
  ON success_stories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_success_stories_updated_at
  BEFORE UPDATE ON success_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few example stories so the feed isn't empty (editable/removable via the
-- admin curation page).
INSERT INTO success_stories (student_name, scholarship_name, country, country_flag, year, quote, story) VALUES
(
  'Mahlet T.', 'Chevening Scholarship', 'United Kingdom', '🇬🇧', 2024,
  'Eagle Pathway helped me turn a rough draft into a winning statement of purpose.',
  'I almost didn''t apply — the SOP felt impossible. Working through drafts and the mock interview gave me the confidence to tell my story clearly. I''m now studying Public Policy in the UK.'
),
(
  'Dawit A.', 'DAAD Scholarship', 'Germany', '🇩🇪', 2024,
  'The deadline reminders and document checklist kept me on track.',
  'Coming from Addis, I had no one to guide me through German applications. Having every requirement laid out, plus help structuring my research proposal, made all the difference.'
),
(
  'Sara G.', 'Mastercard Foundation Scholars Program', 'Canada', '🇨🇦', 2023,
  'From a small town to a fully funded undergraduate degree in Canada.',
  'I focused on my leadership and community work, and the team helped me show it. The interview practice was exactly like the real thing.'
);
