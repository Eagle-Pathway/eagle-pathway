-- ============================================================
-- EAGLE PATHWAY — SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL editor for fresh setup.
-- For existing environments, see MIGRATION NOTES at the bottom.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SCHEMA VERSIONING ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_versions (
  version       TEXT PRIMARY KEY,
  description   TEXT,
  applied_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_versions (version, description) 
VALUES ('1.0.0', 'Initial reconciled base schema')
ON CONFLICT (version) DO NOTHING;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'parent', 'tutor', 'admin');

CREATE TABLE users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  phone                 TEXT UNIQUE NOT NULL,
  email                 TEXT,
  role                  TEXT NOT NULL DEFAULT 'student',
  avatar_url            TEXT,
  grade_level           TEXT,
  city                  TEXT DEFAULT 'Addis Ababa',
  academic_summary      TEXT,
  career_goals          TEXT,
  interested_subjects   TEXT[] DEFAULT '{}',
  gpa                   NUMERIC,
  gpa_max               NUMERIC DEFAULT 4.0,
  target_countries      TEXT[] DEFAULT '{}',
  has_ielts             BOOLEAN DEFAULT FALSE,
  is_english_medium     BOOLEAN DEFAULT FALSE,
  target_degree_level   TEXT,
  has_extracurriculars  BOOLEAN DEFAULT FALSE,
  target_departments    TEXT[] DEFAULT '{}',
  roles                 TEXT[] DEFAULT ARRAY['student'],
  active_role           TEXT DEFAULT 'student',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER ROLES ──────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role = ANY (ARRAY['student'::text, 'parent'::text, 'tutor'::text, 'admin'::text])),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (is_admin());

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());

-- Sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
BEGIN
  INSERT INTO public.users (id, full_name, email, roles, active_role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    ARRAY[requested_role],
    requested_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Also insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle lazy profile creation on role switch
CREATE OR REPLACE FUNCTION public.handle_role_switch()
RETURNS TRIGGER AS $$
BEGIN
  -- If switching to tutor, create tutor profile if not exists
  IF NEW.role = 'tutor' THEN
    INSERT INTO tutors (user_id, bio, is_verified)
    VALUES (NEW.user_id, '', FALSE)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER role_switch_trigger
  AFTER INSERT ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_role_switch();

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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER update_tutors_updated_at
  BEFORE UPDATE ON tutors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant bookings" ON bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR is_admin());
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id OR is_admin());
CREATE POLICY "Participants can update bookings" ON bookings FOR UPDATE USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR is_admin());

-- ─── INTERNATIONAL SERVICES ──────────────────────────────────────────────────
CREATE TYPE service_type AS ENUM (
  'application_fee',
  'tuition_fee',
  'international',
  'international_payment',
  'tuition_payment',
  'bank_transfer',
  'other'
);

CREATE TYPE service_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'completed', 'cancelled');

CREATE TABLE service_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type      service_type NOT NULL,
  from_currency    TEXT NOT NULL,
  to_currency      TEXT NOT NULL,
  amount           DECIMAL(15,2) NOT NULL,
  country_from      TEXT,
  country_to       TEXT NOT NULL,
  recipient_name   TEXT NOT NULL,
  recipient_bank    TEXT,
  recipient_account TEXT,
  reason           TEXT NOT NULL,
  additional_details TEXT,
  status            service_status NOT NULL DEFAULT 'pending',
  admin_note        TEXT,
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can create requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage requests" ON service_requests FOR UPDATE USING (is_admin());

-- ─── SCHOLARSHIPS ─────────────────────────────────────────────────────────────
CREATE TYPE degree_level AS ENUM ('undergraduate', 'masters', 'phd', 'all');
CREATE TYPE funding_type AS ENUM ('fully_funded', 'partial', 'stipend_only');

CREATE TABLE scholarships (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                         TEXT NOT NULL,
  organization                 TEXT NOT NULL,
  country                      TEXT NOT NULL,
  country_flag                 TEXT NOT NULL DEFAULT '🌍',
  degree_levels                degree_level[] NOT NULL DEFAULT '{}',
  funding_type                 funding_type NOT NULL DEFAULT 'fully_funded',
  funding_details              TEXT NOT NULL DEFAULT 'Fully Funded',
  description                  TEXT NOT NULL,
  requirements                 TEXT[] DEFAULT '{}',
  benefits                     JSONB DEFAULT '{}',
  deadline                     DATE NOT NULL,
  fields_of_study              TEXT[],
  min_gpa                      NUMERIC,
  min_gpa_max                  NUMERIC DEFAULT 4.0,
  eagle_success_rate           INTEGER,
  website_url                  TEXT,
  image_url                    TEXT,
  is_active                    BOOLEAN DEFAULT TRUE,
  requires_ielts               BOOLEAN DEFAULT FALSE,
  accepts_english_medium       BOOLEAN DEFAULT FALSE,
  target_departments           TEXT[] DEFAULT ARRAY['Any'],
  recommendation_letters_count INTEGER DEFAULT 0,
  created_at                   TIMESTAMPTZ DEFAULT NOW()
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
  consultant_feedback TEXT,
  ai_feedback      JSONB DEFAULT '{"score":0,"feedback":"No AI audit performed yet.","suggestions":[],"last_reviewed_at":null}',
  notes            TEXT,
  submitted_at     TIMESTAMPTZ,
  result_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
  file_path       TEXT,
  file_url        TEXT NOT NULL,
  file_size       BIGINT DEFAULT 0,
  status          document_status DEFAULT 'pending',
  reviewer_notes  TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- ─── STUDENT TASKS ────────────────────────────────────────────────────────────
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'overdue');
CREATE TYPE task_type AS ENUM ('document', 'sop', 'payment', 'session', 'other');

CREATE TABLE student_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE,
  status          TEXT DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'overdue'::text])),
  type            TEXT CHECK (type = ANY (ARRAY['document'::text, 'sop'::text, 'payment'::text, 'session'::text, 'other'::text])),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relevant tasks" ON student_tasks FOR SELECT USING (auth.uid() = student_id OR is_admin());
CREATE POLICY "Admins can manage tasks" ON student_tasks FOR ALL USING (is_admin());

CREATE TRIGGER update_student_tasks_updated_at
  BEFORE UPDATE ON student_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- MESSAGES
CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  content        TEXT NOT NULL,
  image_url      TEXT,
  is_read        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR is_admin());
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id OR is_admin());
CREATE POLICY "Participants can update messages" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR is_admin());

-- PAYMENTS
CREATE TYPE payment_type AS ENUM ('scholarship_package', 'tutor_booking');
CREATE TYPE payment_method AS ENUM ('telebirr', 'cbe');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference_id   UUID,
  payment_type   TEXT NOT NULL,
  method         TEXT NOT NULL,
  amount         INTEGER NOT NULL CHECK (amount > 0),
  transaction_id TEXT NOT NULL,
  receipt_path   TEXT,
  receipt_url    TEXT,
  status         payment_status NOT NULL DEFAULT 'pending',
  admin_notes    TEXT,
  reviewed_by    UUID REFERENCES users(id),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(method, transaction_id)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update payments" ON payments FOR UPDATE USING (is_admin());

-- TUTOR PAYOUTS
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TABLE tutor_payouts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id       UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL CHECK (amount > 0),
  bank_name      TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name   TEXT NOT NULL,
  status         payout_status NOT NULL DEFAULT 'pending',
  admin_notes    TEXT,
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tutor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutors can view own payouts" ON tutor_payouts FOR SELECT USING (auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id) OR is_admin());
CREATE POLICY "Tutors can request payouts" ON tutor_payouts FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM tutors WHERE id = tutor_id));
CREATE POLICY "Admins can update payouts" ON tutor_payouts FOR UPDATE USING (is_admin());

-- PARENT-STUDENT LINKS
CREATE TABLE parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view linked students" ON parent_student_links FOR SELECT USING (
  parent_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND active_role = 'admin')
);

CREATE POLICY "Parents can create links" ON parent_student_links FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update links" ON parent_student_links FOR UPDATE USING (parent_id = auth.uid());

-- BOOKING RATINGS
CREATE TABLE booking_ratings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

ALTER TABLE booking_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking participants can view ratings" ON booking_ratings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN tutors t ON t.id = b.tutor_id
    WHERE b.id = booking_id AND (b.student_id = auth.uid() OR t.user_id = auth.uid() OR is_admin())
  )
);
CREATE POLICY "Students can rate completed bookings" ON booking_ratings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id AND b.student_id = auth.uid() AND b.status = 'completed'
  )
);

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('documents', 'documents', false),
  ('receipts', 'receipts', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));

CREATE POLICY "Users can upload own receipts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin()));

CREATE POLICY "Users can upload own avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatars are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

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

-- ─── MIGRATION NOTES (FOR EXISTING ENVIRONMENTS) ──────────────────────────────
/*
  IF YOU HAVE AN EXISTING DATABASE, RUN THESE STEPS:
  
  1. Sync user_roles table:
     INSERT INTO user_roles (user_id, role, created_at)
     SELECT id, unnest(roles), created_at FROM users
     ON CONFLICT (user_id, role) DO NOTHING;
     
  2. Add updated_at columns if missing:
     ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
     -- Repeat for tutors, applications, etc.
*/
