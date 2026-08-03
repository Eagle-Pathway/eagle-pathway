-- =========================================================================
-- FIX TUTORS TABLE RLS POLICIES FOR ADMIN APPROVALS & REJECTIONS
-- Allows administrators (public.is_admin()) to UPDATE and INSERT tutor records.
-- =========================================================================

DROP POLICY IF EXISTS "Tutors can update own profile" ON public.tutors;
CREATE POLICY "Tutors can update own profile" ON public.tutors 
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Tutors can insert own profile" ON public.tutors;
CREATE POLICY "Tutors can insert own profile" ON public.tutors 
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
