-- Migration: Secure Ethiopian Payment Verification Engine
-- Author: Eagle Pathway Security Engineering
-- Description: Adds database-level uniqueness constraint to prevent payment double-spending race conditions and columns for bank verification telemetry.

-- 1. Enforce PostgreSQL Unique Constraint on (method, transaction_id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_provider_reference'
  ) THEN
    ALTER TABLE payments 
    ADD CONSTRAINT unique_provider_reference UNIQUE (method, transaction_id);
  END IF;
END $$;

-- 2. Add Telemetry Columns for Bank Verification & Source of Truth Audit
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification' 
CHECK (verification_status IN ('pending_verification', 'verified', 'manual_review', 'rejected')),
ADD COLUMN IF NOT EXISTS bank_verification_data JSONB,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Performance Index on transaction_id and method
CREATE INDEX IF NOT EXISTS idx_payments_method_txid ON payments(method, transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_verification_status ON payments(verification_status);
