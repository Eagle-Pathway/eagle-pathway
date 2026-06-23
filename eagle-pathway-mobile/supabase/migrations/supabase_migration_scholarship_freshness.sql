-- Scholarship data freshness metadata.
--
-- Scholarship listings rot quickly: deadlines move, official URLs change, and
-- application pages close. These fields let the admin dashboard track when a
-- listing was last verified and let the mobile app signal trust to students.

ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (source_status IN ('verified', 'unverified', 'stale', 'broken')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS stale_reason TEXT;

UPDATE public.scholarships
SET source_url = COALESCE(source_url, website_url)
WHERE source_url IS NULL
  AND website_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scholarships_source_status
  ON public.scholarships(source_status);

CREATE INDEX IF NOT EXISTS idx_scholarships_verified_at
  ON public.scholarships(verified_at);
