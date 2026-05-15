-- ATOMIC SOP DRAFT COUNTER (ISSUE-08)
-- This migration adds a server-side function to increment the SOP draft number 
-- atomically, preventing race conditions when multiple updates occur.

CREATE OR REPLACE FUNCTION public.increment_sop_draft(application_id UUID, new_content TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.applications
  SET 
    sop_draft_number = COALESCE(sop_draft_number, 0) + 1,
    sop_content = new_content,
    updated_at = NOW()
  WHERE id = application_id;
  
  -- If no row was updated, it might be an invalid ID
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application with ID % not found', application_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_sop_draft(UUID, TEXT) TO authenticated;
