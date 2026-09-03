-- Migration: Add cloud_url and text_content to documents table for Zero-Storage 100% Text Mode
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS cloud_url TEXT,
ADD COLUMN IF NOT EXISTS text_content TEXT;

ALTER TABLE public.documents 
ALTER COLUMN file_path DROP NOT NULL,
ALTER COLUMN file_name DROP NOT NULL;
