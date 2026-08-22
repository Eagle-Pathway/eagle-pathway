-- ============================================================================
-- EAGLE PATHWAY — COMPLETE MASTER DATABASE SCHEMA
-- File: supabase/schema_master.sql
-- Description: Run this ONE file in Supabase SQL Editor on a fresh database
-- to initialize 100% of tables, types, constraints, functions, RLS, and indices.
-- ============================================================================

-- ── 1. EXTENSIONS ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. DROP EVERYTHING IF CLEANING RE-RUN (SAFE IF EXISTS) ─────────────────
-- Uncomment the following line if you wish to reset a dev database:
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

-- ── 3. CORE TABLES ──────────────────────────────────────────────────────────

-- USERS TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent', 'tutor', 'admin', 'archived')),
  active_role TEXT CHECK (active_role IN ('student', 'parent', 'tutor', 'admin', 'archived')),
  avatar_url TEXT,
  grade_level TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Student Profile Fields
  academic_summary TEXT,
  career_goals TEXT,
  interested_subjects TEXT[],
  gpa NUMERIC,
  gpa_max NUMERIC,
  target_countries TEXT[],
  has_ielts BOOLEAN,
  is_english_medium BOOLEAN,
  target_degree_level TEXT,
  has_extracurriculars BOOLEAN,
  target_departments TEXT[],
  referral_code TEXT,
  signup_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  first_landing_url TEXT,

  -- Tutor & Parent Profile Fields
  living_address TEXT,
  university_name TEXT,
  telegram_username TEXT,
  cgpa TEXT,
  teaching_experience TEXT,
  children_count INTEGER,
  children_grades TEXT[],
  preferred_tutor_gender TEXT,
  preferred_session_format TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER ROLES TABLE (Source of truth for multi-role checks)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'tutor', 'admin', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- SCHOLARSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  country TEXT NOT NULL,
  funding_type TEXT NOT NULL,
  degree_level TEXT NOT NULL,
  deadline DATE,
  description TEXT,
  requirements TEXT[],
  benefits TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  requires_ielts BOOLEAN DEFAULT FALSE,
  accepts_english_medium BOOLEAN DEFAULT FALSE,
  target_departments TEXT[],
  recommendation_letters_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('silver', 'gold', 'diamond', 'basic', 'standard', 'premium')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'personal_info', 'documents', 'sop', 'submitted', 'under_review', 'interview', 'accepted', 'approved', 'rejected')),
  sop_content TEXT,
  sop_draft_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  document_type TEXT NOT NULL,
  file_size NUMERIC,
  mime_type TEXT,
  status TEXT DEFAULT 'pending',
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reference_id UUID,
  payment_type TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('telebirr', 'cbe')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transaction_id TEXT NOT NULL,
  receipt_path TEXT,
  receipt_url TEXT,
  receipt_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  verification_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (verification_status IN ('pending_verification', 'verified', 'manual_review', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTORS TABLE
CREATE TABLE IF NOT EXISTS public.tutors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hourly_rate NUMERIC DEFAULT 400,
  subjects TEXT[],
  bio TEXT,
  rating NUMERIC DEFAULT 5.0,
  total_sessions INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.tutor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR JOB POSTS TABLE
CREATE TABLE IF NOT EXISTS public.tutor_job_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place TEXT NOT NULL,
  grade TEXT NOT NULL,
  subjects TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'open',
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_time TIMESTAMPTZ NOT NULL,
  session_date DATE,
  subject TEXT DEFAULT 'General Tutoring',
  amount NUMERIC NOT NULL CHECK (amount > 0),
  platform_fee NUMERIC DEFAULT 0,
  duration_hours NUMERIC DEFAULT 1.0,
  session_type TEXT DEFAULT 'online',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.tutor_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUSH TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  key TEXT PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. UNIQUE INDEXES ───────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_slot 
ON public.bookings (tutor_id, session_time) 
WHERE status NOT IN ('cancelled', 'rejected');

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_txn_method 
ON public.payments (method, transaction_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt_hash 
ON public.payments (receipt_hash) 
WHERE receipt_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- ── 5. STORED PROCEDURES & RPC FUNCTIONS ───────────────────────────────────

-- ADMIN VERIFICATION RPC
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid()) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND (role = 'admin' OR active_role = 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
END;
$$;

-- ATOMIC TUTOR SLOT RESERVATION RPC
CREATE OR REPLACE FUNCTION public.reserve_tutor_slot(
  p_tutor_id UUID,
  p_student_id UUID,
  p_session_time TIMESTAMPTZ,
  p_subject TEXT DEFAULT 'General Tutoring',
  p_hourly_rate NUMERIC DEFAULT 400
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
  v_new_booking_id UUID;
BEGIN
  SELECT id INTO v_existing_id
  FROM public.bookings
  WHERE tutor_id = p_tutor_id
    AND session_time = p_session_time
    AND status NOT IN ('cancelled', 'rejected')
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SLOT_TAKEN',
      'message', 'This session time slot has already been booked by another student. Please select a different time.'
    );
  END IF;

  INSERT INTO public.bookings (
    tutor_id,
    student_id,
    session_time,
    subject,
    amount,
    status,
    created_at
  ) VALUES (
    p_tutor_id,
    p_student_id,
    p_session_time,
    p_subject,
    p_hourly_rate,
    'confirmed',
    NOW()
  ) RETURNING id INTO v_new_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_new_booking_id,
    'message', 'Session slot successfully reserved.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', 'DATABASE_ERROR',
    'message', SQLERRM
  );
END;
$$;

-- AI RATE LIMIT CHECKER RPC
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_rec RECORD;
  v_allowed BOOLEAN;
  v_remaining INT;
  v_reset INT;
BEGIN
  SELECT * INTO v_rec FROM public.ai_rate_limits WHERE key = p_key FOR UPDATE;

  IF v_rec.key IS NULL THEN
    INSERT INTO public.ai_rate_limits (key, request_count, window_start)
    VALUES (p_key, 1, v_now);
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', p_limit,
      'remaining', p_limit - 1,
      'reset', extract(epoch FROM v_now) + p_window_seconds
    );
  END IF;

  IF extract(epoch FROM (v_now - v_rec.window_start)) > p_window_seconds THEN
    UPDATE public.ai_rate_limits
    SET request_count = 1, window_start = v_now
    WHERE key = p_key;
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', p_limit,
      'remaining', p_limit - 1,
      'reset', extract(epoch FROM v_now) + p_window_seconds
    );
  END IF;

  IF v_rec.request_count >= p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'limit', p_limit,
      'remaining', 0,
      'reset', extract(epoch FROM v_rec.window_start) + p_window_seconds
    );
  END IF;

  UPDATE public.ai_rate_limits
  SET request_count = request_count + 1
  WHERE key = p_key;

  RETURN jsonb_build_object(
    'allowed', true,
    'limit', p_limit,
    'remaining', p_limit - (v_rec.request_count + 1),
    'reset', extract(epoch FROM v_rec.window_start) + p_window_seconds
  );
END;
$$;

-- GET APPROVED TUTOR PUSH TOKENS RPC
CREATE OR REPLACE FUNCTION public.get_approved_tutor_push_tokens()
RETURNS TABLE (user_id UUID, token TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT pt.user_id, pt.token
  FROM public.push_tokens pt
  JOIN public.users u ON u.id = pt.user_id
  WHERE u.role = 'tutor' OR u.is_verified = TRUE;
$$;

-- SEARCH SCHOLARSHIPS RPC
CREATE OR REPLACE FUNCTION public.search_scholarships(
  p_query TEXT,
  p_limit INT DEFAULT 50
) RETURNS SETOF public.scholarships
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.scholarships
  WHERE is_active = TRUE
    AND (
      name ILIKE '%' || p_query || '%'
      OR organization ILIKE '%' || p_query || '%'
      OR country ILIKE '%' || p_query || '%'
      OR description ILIKE '%' || p_query || '%'
    )
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- AUTOMATIC AUTH USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Eagle User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. ROW LEVEL SECURITY (RLS) & PERMISSIONS ──────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.scholarships TO anon;
GRANT SELECT ON public.resources TO anon;

-- Enable Supabase Realtime Publication for Payments & Bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if publication is unmanaged in local dev
  NULL;
END $$;
