-- Migration: Security & Payment Hardening
-- 1. Enforce strict uniqueness on payments.transaction_id to prevent duplicate transaction replay
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments (transaction_id);

-- 2. Index push_tokens for ultra-fast lookup on booking triggers
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_lookup ON public.push_tokens (user_id, token);
