-- SECURE PARENT-STUDENT LINKS (RECONCILIATION & SECURITY)
-- This migration creates the parent_student_links table if it's missing 
-- and implements the secure RLS policies (ISSUE-07).

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- 2. Enable RLS
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies (to prevent duplicates)
DROP POLICY IF EXISTS "Parents can view linked students" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can create links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can update links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Students can view incoming requests" ON public.parent_student_links;
DROP POLICY IF EXISTS "Students can verify link requests" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can withdraw requests" ON public.parent_student_links;
DROP POLICY IF EXISTS "Students can break links" ON public.parent_student_links;

-- 4. IMPLEMENT SECURE POLICIES

-- Policy: Parents can create link requests
CREATE POLICY "Parents can create links" 
ON public.parent_student_links 
FOR INSERT 
WITH CHECK (parent_id = auth.uid());

-- Policy: Parents can see their own link requests
CREATE POLICY "Parents can view linked students" 
ON public.parent_student_links 
FOR SELECT 
USING (parent_id = auth.uid());

-- Policy: Students can see requests sent to them
CREATE POLICY "Students can view incoming requests" 
ON public.parent_student_links 
FOR SELECT 
USING (student_id = auth.uid());

-- Policy: Students (ONLY) can verify or reject requests sent to them
CREATE POLICY "Students can verify link requests" 
ON public.parent_student_links 
FOR UPDATE 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Policy: Parents can withdraw pending requests
CREATE POLICY "Parents can withdraw requests" 
ON public.parent_student_links 
FOR DELETE 
USING (parent_id = auth.uid() AND is_verified = false);

-- Policy: Students can break an existing link
CREATE POLICY "Students can break links" 
ON public.parent_student_links 
FOR DELETE 
USING (student_id = auth.uid());

-- Policy: Admins can view everything for support
CREATE POLICY "Admins can view all links" 
ON public.parent_student_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (active_role = 'admin' OR 'admin' = ANY(roles))
  )
);
