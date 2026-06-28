-- =========================================================================
-- RESOURCES (admin-curated, role-targeted)
-- A library of helpful materials the admin posts for a given audience:
--   * students  → sample SOPs, motivation letters, checklists
--   * tutors    → "tutor smart" guides, downloadable attendance sheets
--   * parents   → how-to-support guides
--   * all       → app-wide resources everyone sees
-- Each resource is either an uploaded file (PDF/DOCX in the private `resources`
-- bucket) or an external link (Google Doc, YouTube, …). Admin-curated only:
-- the audience reads published rows; admins manage everything.
-- =========================================================================

CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'General',
  -- Single audience per resource. 'all' is visible to every signed-in user.
  audience      TEXT NOT NULL DEFAULT 'all'
                CHECK (audience IN ('all', 'student', 'tutor', 'parent')),
  resource_type TEXT NOT NULL DEFAULT 'file'
                CHECK (resource_type IN ('file', 'link')),
  -- File payload (resource_type = 'file'): path within the private `resources`
  -- storage bucket; the app mints a short-lived signed URL on tap.
  file_path     TEXT,
  file_name     TEXT,
  file_size     INTEGER,
  mime_type     TEXT,
  -- Link payload (resource_type = 'link').
  external_url  TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A file resource must carry a file_path; a link resource must carry a URL.
  CONSTRAINT resource_payload_present CHECK (
    (resource_type = 'file' AND file_path IS NOT NULL)
    OR (resource_type = 'link' AND external_url IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_resources_audience
  ON resources (is_published, audience, category, sort_order);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Audience-gated read: a signed-in user sees published resources whose audience
-- is 'all' or matches their own role; admins see and manage everything.
CREATE POLICY "Resources visible to their audience"
  ON resources FOR SELECT TO authenticated
  USING (
    is_admin()
    OR (
      is_published
      AND (
        audience = 'all'
        OR audience = (SELECT role::text FROM users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins manage resources"
  ON resources FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- Private storage bucket for resource files.
-- Reads are via short-lived signed URLs minted by the app; writes are
-- admin-only. The table RLS above is what hides a resource (and its path) from
-- the wrong audience — same trust model as the document vault.
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Resource files readable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resources');

CREATE POLICY "Admins upload resource files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins update resource files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins delete resource files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND is_admin());

-- =========================================================================
-- Seed a few starter LINK resources so the section isn't empty. (No file rows
-- are seeded — a file row without an uploaded object would download nothing.
-- Admins add file resources from the dashboard.) All editable/removable there.
-- =========================================================================
INSERT INTO resources (title, description, category, audience, resource_type, external_url, sort_order) VALUES
('Sample Statement of Purpose', 'A strong SOP example to model your own draft on.', 'Sample SOPs', 'student', 'link', 'https://eagle-pathway.vercel.app/resources/sample-sop', 1),
('Motivation Letter Template', 'Structure and tone for a compelling motivation letter.', 'Templates', 'student', 'link', 'https://eagle-pathway.vercel.app/resources/motivation-letter', 2),
('How to Tutor Smart', 'Practical strategies for effective one-on-one sessions.', 'Tutoring Guides', 'tutor', 'link', 'https://eagle-pathway.vercel.app/resources/tutor-smart', 1),
('Supporting Your Child''s Applications', 'How parents can help without taking over.', 'Parent Guides', 'parent', 'link', 'https://eagle-pathway.vercel.app/resources/parent-guide', 1),
('Welcome to Eagle Pathway', 'Get the most out of the app.', 'Getting Started', 'all', 'link', 'https://eagle-pathway.vercel.app/resources/welcome', 1);
