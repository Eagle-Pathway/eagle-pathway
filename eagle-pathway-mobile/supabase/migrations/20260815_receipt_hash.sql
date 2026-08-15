-- Migration: Receipt Image Fingerprinting & Unique Anti-Replay Constraint
-- Author: Eagle Pathway Security Engineering
-- Description: Adds SHA-256 receipt image hash tracking to prevent re-uploading identical payment screenshots.

-- 1. Add receipt_hash column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS receipt_hash TEXT;

-- 2. Create partial unique index on receipt_hash (only for non-null hashes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt_hash 
ON payments(receipt_hash) 
WHERE receipt_hash IS NOT NULL;

-- 3. Create index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_payments_receipt_hash_lookup 
ON payments(receipt_hash);
