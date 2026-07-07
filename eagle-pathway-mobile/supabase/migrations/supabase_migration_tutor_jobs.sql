-- ─── TUTOR VERIFICATION APPLICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tutor_id uuid references users(id) on delete cascade unique,
  status text default 'pending' check (status = any(array['pending', 'approved', 'rejected'])),
  rejection_reason text,
  rejection_reason_category text,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  grade10_result_url text,
  grade12_result_url text,
  transcript_url text,
  university_name text,
  living_address text,
  phone_number text,
  telegram_username text,
  cgpa text
);

ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors can view own application" ON tutor_applications FOR SELECT USING (auth.uid() = tutor_id OR is_admin());
CREATE POLICY "Tutors can insert own application" ON tutor_applications FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Tutors can update own application" ON tutor_applications FOR UPDATE USING (auth.uid() = tutor_id OR is_admin());
CREATE POLICY "Admins can update applications" ON tutor_applications FOR UPDATE USING (is_admin());

CREATE TRIGGER update_tutor_applications_updated_at
  BEFORE UPDATE ON tutor_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── TUTOR JOB POSTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_job_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  posted_by uuid references users(id),
  place text not null,
  grade text not null,
  subjects text[] not null,
  session_hours numeric not null,
  days_per_week integer not null,
  start_time time not null,
  hourly_rate numeric not null,
  gender_preference text not null check (gender_preference = any(array['male', 'female', 'both'])),
  status text default 'open' check (status = any(array['open', 'closed'])),
  notification_sent boolean default false
);

ALTER TABLE tutor_job_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job posts viewable by all authenticated users" ON tutor_job_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage job posts" ON tutor_job_posts FOR ALL USING (is_admin());

CREATE TRIGGER update_tutor_job_posts_updated_at
  BEFORE UPDATE ON tutor_job_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── TUTOR JOB APPLICATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  job_post_id uuid references tutor_job_posts(id) on delete cascade,
  applicant_id uuid references users(id) on delete cascade,
  status text default 'pending' check (status = any(array['pending', 'contacted', 'hired', 'rejected'])),
  education_status text,
  living_address text,
  university_name text,
  phone_number text,
  telegram_username text,
  cgpa text,
  grade10_result_url text,
  grade12_result_url text,
  transcript_url text,
  policy_agreed boolean default false,
  policy_agreed_at timestamptz,
  unique(job_post_id, applicant_id)
);

ALTER TABLE tutor_job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants can view own job applications" ON tutor_job_applications FOR SELECT USING (auth.uid() = applicant_id OR is_admin());
CREATE POLICY "Applicants can insert own job applications" ON tutor_job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Admins can manage job applications" ON tutor_job_applications FOR ALL USING (is_admin());

CREATE TRIGGER update_tutor_job_applications_updated_at
  BEFORE UPDATE ON tutor_job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── STORAGE BUCKET ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('tutor-documents', 'tutor-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own tutor documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tutor-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own tutor documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'tutor-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));

CREATE POLICY "Admins can view all tutor documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'tutor-documents' AND is_admin());
