-- Secure SOP draft updates.
--
-- The original increment_sop_draft RPC was SECURITY DEFINER and updated by
-- application id only. Because SECURITY DEFINER bypasses table RLS, any
-- authenticated caller who knew an application UUID could potentially update
-- another student's SOP. Keep the atomic counter behavior, but authorize inside
-- the function before writing.

CREATE OR REPLACE FUNCTION public.increment_sop_draft(application_id UUID, new_content TEXT)
RETURNS void AS $$
DECLARE
  v_student_id UUID;
  v_consultant_id UUID;
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
  WHERE a.id = application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.increment_sop_draft(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_sop_draft(UUID, TEXT) TO authenticated;
