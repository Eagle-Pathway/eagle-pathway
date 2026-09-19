-- Ensure gender_preference and job logistics columns exist on tutor_job_posts
ALTER TABLE public.tutor_job_posts 
ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'both';
