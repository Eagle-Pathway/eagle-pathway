-- SOP draft history.
--
-- Applications currently keep only the latest SOP text plus a draft counter.
-- Store every saved draft so the product can show version history, score
-- movement, and before/after diffs.

CREATE TABLE IF NOT EXISTS public.sop_drafts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  draft_number    INTEGER NOT NULL,
  content         TEXT NOT NULL,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(application_id, draft_number)
);

ALTER TABLE public.sop_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant SOP drafts" ON public.sop_drafts;
CREATE POLICY "Users can view relevant SOP drafts"
ON public.sop_drafts
FOR SELECT
USING (
  auth.uid() = student_id
  OR public.is_admin()
  OR auth.uid() IN (
    SELECT consultant_id
    FROM public.applications
    WHERE id = public.sop_drafts.application_id
  )
);

CREATE INDEX IF NOT EXISTS idx_sop_drafts_application_created
  ON public.sop_drafts(application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sop_drafts_student
  ON public.sop_drafts(student_id);

CREATE OR REPLACE FUNCTION public.increment_sop_draft(application_id UUID, new_content TEXT)
RETURNS void AS $$
DECLARE
  v_student_id UUID;
  v_consultant_id UUID;
  v_draft_number INTEGER;
BEGIN
  SELECT a.student_id, a.consultant_id
    INTO v_student_id, v_consultant_id
  FROM public.applications a
  WHERE a.id = application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application with ID % not found', application_id;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF auth.uid() IS DISTINCT FROM v_student_id
     AND auth.uid() IS DISTINCT FROM v_consultant_id
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: only the student, assigned consultant, or an admin can update this SOP draft.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.applications a
  SET
    sop_draft_number = COALESCE(a.sop_draft_number, 0) + 1,
    sop_content = new_content,
    updated_at = NOW()
  WHERE a.id = application_id
  RETURNING a.sop_draft_number INTO v_draft_number;

  INSERT INTO public.sop_drafts (
    application_id,
    student_id,
    draft_number,
    content,
    created_by
  )
  VALUES (
    application_id,
    v_student_id,
    v_draft_number,
    new_content,
    auth.uid()
  )
  ON CONFLICT (application_id, draft_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.increment_sop_draft(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_sop_draft(UUID, TEXT) TO authenticated;

