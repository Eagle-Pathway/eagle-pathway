-- ============================================================
-- EAGLE PATHWAY — MIGRATION: Multi-Persona + Advanced Matching
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── USERS: Add multi-persona and advanced profile fields ────
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['student'];
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'student';
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_summary TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goals TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interested_subjects TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gpa DECIMAL(3,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_ielts BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_english_medium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_degree_level TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_extracurriculars BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_departments TEXT[] DEFAULT '{}';

-- ─── SCHOLARSHIPS: Add advanced matching fields ──────────────
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS min_gpa DECIMAL(3,2);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS requires_ielts BOOLEAN DEFAULT FALSE;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS accepts_english_medium BOOLEAN DEFAULT FALSE;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS target_departments TEXT[] DEFAULT ARRAY['Any'];
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS recommendation_letters_count INTEGER DEFAULT 0;
