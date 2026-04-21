-- ============================================================
-- EAGLE PATHWAY — SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'parent', 'tutor', 'admin');

CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT UNIQUE NOT NULL,
  email       TEXT,
  role        user_role NOT NULL DEFAULT 'student',
  avatar_url  TEXT,
  grade_level TEXT,
  city        TEXT DEFAULT 'Addis Ababa',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());

-- Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── TUTORS ───────────────────────────────────────────────────────────────────
CREATE TABLE tutors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  subjects        TEXT[] NOT NULL DEFAULT '{}',
  grade_levels    TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate     INTEGER NOT NULL DEFAULT 400,
  rating          DECIMAL(3,2) DEFAULT 5.0,
  total_reviews   INTEGER DEFAULT 0,
  total_sessions  INTEGER DEFAULT 0,
  response_rate   INTEGER DEFAULT 100,
  is_online       BOOLEAN DEFAULT TRUE,
  is_in_person    BOOLEAN DEFAULT FALSE,
  location        TEXT,
  education       TEXT,
  availability    JSONB DEFAULT '{}',
  is_verified     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors are viewable by all" ON tutors FOR SELECT USING (true);
CREATE POLICY "Tutors can update own profile" ON tutors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Tutors can insert own profile" ON tutors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── TUTOR REVIEWS ────────────────────────────────────────────────────────────
CREATE TABLE tutor_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id    UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, student_id)
);

ALTER TABLE tutor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by all" ON tutor_reviews FOR SELECT USING (true);
CREATE POLICY "Students can create reviews" ON tutor_reviews FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Update tutor rating on new review
CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutors SET
    rating = (SELECT AVG(rating) FROM tutor_reviews WHERE tutor_id = NEW.tutor_id),
    total_reviews = (SELECT COUNT(*) FROM tutor_reviews WHERE tutor_id = NEW.tutor_id)
  WHERE id = NEW.tutor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_trigger
AFTER INSERT OR UPDATE ON tutor_reviews
FOR EACH ROW EXECUTE FUNCTION update_tutor_rating();

-- ─── BOOKINGS ─────────────────────────────────────────────────────────────────
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('online', 'in_person');

CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id        UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  session_date    DATE NOT NULL,
  session_time    TIME NOT NULL,
  duration_hours  DECIMAL(3,1) DEFAULT 1.0,
  session_type    session_type NOT NULL DEFAULT 'online',
  status          booking_status NOT NULL DEFAULT 'pending',
  notes           TEXT,
  total_amount    INTEGER NOT NULL,
  platform_fee    INTEGER NOT NULL DEFAULT 0,
  zoom_link       TEXT,
  location        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant bookings" ON bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR is_admin());
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id OR is_admin());
CREATE POLICY "Participants can update bookings" ON bookings FOR UPDATE USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR is_admin());

-- ─── SCHOLARSHIPS ─────────────────────────────────────────────────────────────
CREATE TYPE degree_level AS ENUM ('undergraduate', 'masters', 'phd', 'all');
CREATE TYPE funding_type AS ENUM ('fully_funded', 'partial', 'stipend_only');

CREATE TABLE scholarships (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  organization         TEXT NOT NULL,
  country              TEXT NOT NULL,
  country_flag         TEXT NOT NULL DEFAULT '🌍',
  degree_levels        degree_level[] NOT NULL DEFAULT '{}',
  funding_type         funding_type NOT NULL DEFAULT 'fully_funded',
  funding_details      TEXT NOT NULL DEFAULT 'Fully Funded',
  description          TEXT NOT NULL,
  requirements         TEXT[] DEFAULT '{}',
  benefits             JSONB DEFAULT '{}',
  deadline             DATE NOT NULL,
  fields_of_study      TEXT[],
  eagle_success_rate   INTEGER,
  website_url          TEXT,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scholarships viewable by all authenticated users" ON scholarships FOR SELECT TO authenticated USING (true);

-- ─── APPLICATIONS ─────────────────────────────────────────────────────────────
CREATE TYPE application_status AS ENUM ('draft','personal_info','documents','sop','submitted','interview','accepted','rejected');
CREATE TYPE package_tier AS ENUM ('basic', 'standard', 'premium');

CREATE TABLE applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scholarship_id   UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  consultant_id    UUID REFERENCES users(id),
  package_tier     package_tier NOT NULL DEFAULT 'basic',
  status           application_status NOT NULL DEFAULT 'personal_info',
  sop_content      TEXT,
  sop_draft_number INTEGER DEFAULT 0,
  notes            TEXT,
  submitted_at     TIMESTAMPTZ,
  result_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant applications" ON applications FOR SELECT USING (auth.uid() = student_id OR auth.uid() = consultant_id OR is_admin());
CREATE POLICY "Students can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = student_id OR is_admin());
CREATE POLICY "Participants can update applications" ON applications FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = consultant_id OR is_admin());
CREATE POLICY "Admins can delete applications" ON applications FOR DELETE USING (is_admin());

-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────
CREATE TYPE document_type AS ENUM ('degree_certificate','transcript','passport','cv','ielts_certificate','reference_letter','sop','other');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  document_type   document_type NOT NULL DEFAULT 'other',
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       BIGINT DEFAULT 0,
  status          document_status DEFAULT 'pending',
  reviewer_notes  TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant documents" ON documents FOR SELECT USING (auth.uid() = user_id OR is_admin() OR auth.uid() IN (SELECT consultant_id FROM applications WHERE id = application_id));
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can update relevant documents" ON documents FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM ('session_reminder','booking_confirmed','scholarship_alert','document_approved','document_rejected','sop_reviewed','application_update','offer_received');

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins can insert notifications" ON notifications FOR INSERT WITH CHECK (is_admin());

-- ─── PUSH TOKENS ──────────────────────────────────────────────────────────────
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── SEED SAMPLE SCHOLARSHIPS ─────────────────────────────────────────────────
INSERT INTO scholarships (name, organization, country, country_flag, degree_levels, funding_type, funding_details, description, requirements, benefits, deadline, eagle_success_rate) VALUES
(
  'Chevening Scholarship',
  'UK Foreign Commonwealth & Development Office',
  'United Kingdom',
  '🇬🇧',
  ARRAY['masters']::degree_level[],
  'fully_funded',
  'Fully Funded',
  'Chevening is the UK government''s global scholarship programme, funded by the Foreign Commonwealth & Development Office. It offers full funding for outstanding individuals to pursue a one-year Masters degree at any UK university.',
  ARRAY['Ethiopian citizenship', 'Bachelor''s degree (minimum 2nd class upper)', 'At least 2 years of work experience', 'IELTS 6.5+ or equivalent', 'Leadership potential demonstrated'],
  '{"Tuition Fees": "100% covered", "Monthly Stipend": "£1,173/month", "Return Flights": "Included", "Visa Application": "Fee covered"}',
  '2025-11-05',
  68
),
(
  'DAAD Scholarship',
  'German Academic Exchange Service',
  'Germany',
  '🇩🇪',
  ARRAY['masters', 'phd']::degree_level[],
  'fully_funded',
  '€1,200/month',
  'The DAAD scholarship supports outstanding international graduates and postgraduates to pursue their academic goals at German universities. Strong focus on STEM, engineering, and social sciences.',
  ARRAY['Bachelor''s or Master''s degree', 'Strong academic record (GPA 3.0+)', 'German or English language proficiency', 'Study plan / research proposal', 'Two letters of recommendation'],
  '{"Monthly Stipend": "€1,200", "Travel Allowance": "€500", "Health Insurance": "Included", "Tuition": "Varies by institution"}',
  '2025-10-15',
  55
),
(
  'Erasmus Mundus Scholarship',
  'European Commission',
  'European Union',
  '🇳🇱',
  ARRAY['masters']::degree_level[],
  'fully_funded',
  '€1,400/month',
  'Erasmus Mundus Joint Master Degrees are international study programs delivered by a consortium of higher education institutions from different countries. Students follow a study program at two or more institutions.',
  ARRAY['Bachelor''s degree in relevant field', 'English proficiency (IELTS 6.0+)', 'Motivation letter', 'Academic references', 'CV/Resume'],
  '{"Monthly Allowance": "€1,400", "Tuition": "Covered", "Travel": "€3,000 lump sum", "Insurance": "Included"}',
  '2026-01-20',
  45
),
(
  'MasterCard Foundation Scholars Program',
  'MasterCard Foundation',
  'Canada / Multiple Countries',
  '🇨🇦',
  ARRAY['undergraduate']::degree_level[],
  'fully_funded',
  'Fully Funded',
  'The Mastercard Foundation Scholars Program partners with leading African and global universities to enable young people from economically disadvantaged backgrounds to access quality higher education.',
  ARRAY['Ethiopian citizenship or African origin', 'Demonstrated financial need', 'Academic excellence', 'Leadership and community service', 'Commitment to give back to Africa'],
  '{"Tuition": "100% covered", "Living Allowance": "Full support", "Books & Supplies": "Covered", "Health Insurance": "Included", "Emergency Fund": "Available"}',
  '2026-03-01',
  35
),
(
  'Commonwealth Scholarship',
  'Commonwealth Scholarship Commission',
  'United Kingdom',
  '🇬🇧',
  ARRAY['masters', 'phd']::degree_level[],
  'fully_funded',
  'Fully Funded',
  'Commonwealth Scholarships are for candidates from low and middle income Commonwealth countries, for full-time Master''s and PhD study at a UK university.',
  ARRAY['Ethiopian/Commonwealth citizenship', 'First degree (minimum upper second class)', 'Cannot be currently studying or living in a developed country', 'Strong development impact potential'],
  '{"Tuition": "100% covered", "Monthly Stipend": "£1,084–£1,330", "Flights": "Return airfare", "Arrival Allowance": "£500"}',
  '2025-12-15',
  50
);
