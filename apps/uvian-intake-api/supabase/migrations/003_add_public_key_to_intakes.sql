-- Migration: 003_add_public_key_to_intakes.sql
-- Add public_key column to existing intakes table for E2E encryption

ALTER TABLE core_intake.intakes 
ADD COLUMN IF NOT EXISTS public_key TEXT NOT NULL DEFAULT 'PLACEHOLDER_KEY_REPLACE_ME';

-- Add constraint to ensure public_key is always provided
-- Note: Existing rows will need their public_key updated

COMMENT ON COLUMN core_intake.intakes.public_key IS 'RSA public key (PEM) for end-to-end encryption of secret fields';
