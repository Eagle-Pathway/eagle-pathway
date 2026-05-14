-- SECURE PARENT-STUDENT LINKS (ISSUE-07)
-- This migration fixes the vulnerability where parents could verify their own link requests.

-- 1. Drop the insecure update policy
DROP POLICY IF EXISTS "Parents can update links" ON public.parent_student_links;

-- 2. Ensure students can see requests sent to them
-- (Existing "Parents can view linked students" only covers parents and admins)
CREATE POLICY "Students can view incoming requests" 
ON public.parent_student_links 
FOR SELECT 
USING (student_id = auth.uid());

-- 3. Allow students to verify or reject requests sent to them
CREATE POLICY "Students can verify link requests" 
ON public.parent_student_links 
FOR UPDATE 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- 4. Allow parents to delete (withdraw) their own pending requests
CREATE POLICY "Parents can withdraw requests" 
ON public.parent_student_links 
FOR DELETE 
USING (parent_id = auth.uid() AND is_verified = false);

-- 5. Add a policy for students to delete/break a link
CREATE POLICY "Students can break links" 
ON public.parent_student_links 
FOR DELETE 
USING (student_id = auth.uid());
