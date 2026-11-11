-- ==============================================================================
-- Eagle Pathway - Careers, Job Applications & Resumes Storage Migration
-- Run this in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/bkkhheaeqhhfeyfwjjxx/sql/new
-- ==============================================================================

-- 1. Create Careers Table
CREATE TABLE IF NOT EXISTS public.careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Addis Ababa / Hybrid',
    employment_type TEXT NOT NULL DEFAULT 'Full-time',
    experience_level TEXT NOT NULL DEFAULT 'Mid-Level',
    salary_range TEXT,
    deadline TEXT,
    summary TEXT NOT NULL,
    description TEXT,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure deadline column exists if table was created previously
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'careers' 
        AND column_name = 'deadline'
    ) THEN 
        ALTER TABLE public.careers ADD COLUMN deadline TEXT;
    END IF;
END $$;

-- 2. Create Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID REFERENCES public.careers(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    linkedin_url TEXT,
    portfolio_url TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_careers_slug ON public.careers(slug);
CREATE INDEX IF NOT EXISTS idx_careers_active ON public.careers(is_active);
CREATE INDEX IF NOT EXISTS idx_job_applications_career_id ON public.job_applications(career_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active careers
DROP POLICY IF EXISTS "Public can view active careers" ON public.careers;
CREATE POLICY "Public can view active careers" 
    ON public.careers 
    FOR SELECT 
    USING (is_active = true);

-- Allow admins & service role full access to careers
DROP POLICY IF EXISTS "Service role full access on careers" ON public.careers;
CREATE POLICY "Service role full access on careers" 
    ON public.careers 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Allow public to submit job applications
DROP POLICY IF EXISTS "Public can submit applications" ON public.job_applications;
CREATE POLICY "Public can submit applications" 
    ON public.job_applications 
    FOR INSERT 
    WITH CHECK (true);

-- Allow admins & service role full access to job applications
DROP POLICY IF EXISTS "Service role full access on job_applications" ON public.job_applications;
CREATE POLICY "Service role full access on job_applications" 
    ON public.job_applications 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. Storage Bucket Setup for Candidate Resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Resumes Storage Policies
DROP POLICY IF EXISTS "Public upload candidate resumes" ON storage.objects;
CREATE POLICY "Public upload candidate resumes" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Public read candidate resumes" ON storage.objects;
CREATE POLICY "Public read candidate resumes" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Service role manage candidate resumes" ON storage.objects;
CREATE POLICY "Service role manage candidate resumes" 
    ON storage.objects 
    FOR ALL 
    USING (bucket_id = 'resumes')
    WITH CHECK (bucket_id = 'resumes');

