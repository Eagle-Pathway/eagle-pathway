-- ============================================================
-- MIGRATION LEDGER SYSTEM
-- Version 1.0
-- ============================================================

-- Metadata table to track migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version         TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  checksum       TEXT
);

-- ============================================================
-- MIGRATION ORDER (run in this sequence)
-- ============================================================

-- M001: Initial schema (base tables, RLS)
-- Status: In supabase_schema.sql (run once for fresh DB)

-- M002: Add user_roles for multi-persona
-- Status: supabase_migration_multipersona_v2.sql 
-- Run AFTER users table exists

-- M003: Add updated_at column  
-- Status: supabase_migration_add_updated_at.sql
-- Adds updated_at + trigger to users

-- M004: Fix tutor_payouts RLS + add reference_number
-- Status: supabase_migration_payouts_fix.sql
-- Fix admin insert + add column

-- M005: Fix student_tasks
-- Status: supabase_migration_fix_student_tasks.sql

-- ============================================================
-- CHECK: Current schema version
-- (No rows = table doesn't exist yet, run the CREATE TABLE first)
SELECT version, name, applied_at 
FROM schema_migrations 
ORDER BY applied_at DESC;