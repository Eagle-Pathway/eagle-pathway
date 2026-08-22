-- ============================================================================
-- Eagle Pathway — Master Consolidated Schema Snapshot
-- Date: 2026-08-22
-- Description: Single source of truth containing all tables, constraints,
-- RLS policies, indices, and RPC procedures for production deployment.
-- ============================================================================

-- 1. EXTENSIONS & SCHEMAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM ('student', 'parent', 'tutor', 'admin', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
    CREATE TYPE application_status_enum AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

-- 3. CORE TABLES

-- USERS TABLE
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('silver', 'gold', 'diamond')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  sop_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  receipt_hash TEXT UNIQUE,
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

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_time TIMESTAMPTZ NOT NULL,
  subject TEXT DEFAULT 'General Tutoring',
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONSTRAINTS & UNIQUE INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booking_slot 
ON public.bookings (tutor_id, session_time) 
WHERE status NOT IN ('cancelled', 'rejected');

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_txn_method 
ON public.payments (method, transaction_id);

-- 5. STORED PROCEDURES & PROCEDURAL RPCs

-- Admin verification helper
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid()) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND (role = 'admin' OR active_role = 'admin')
  );
END;
$$;

-- Atomic Tutor Slot Reservation RPC
CREATE OR REPLACE FUNCTION reserve_tutor_slot(
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

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Permissions Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.scholarships TO anon;
