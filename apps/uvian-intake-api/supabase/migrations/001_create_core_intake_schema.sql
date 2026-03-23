-- Migration: 001_create_core_intake_schema.sql
-- Create core_intake schema for ephemeral intake sessions
-- Description: Stores temporary form intake sessions with TTL-based expiration

-- Create the dedicated schema
CREATE SCHEMA IF NOT EXISTS core_intake;

-- Main intakes table
CREATE TABLE core_intake.intakes (
  id TEXT PRIMARY KEY,                      -- Format: int_abc123 (nanoid)
  title TEXT NOT NULL,
  description TEXT,
  submit_label TEXT DEFAULT 'Submit',
  public_key TEXT NOT NULL,                  -- RSA public key for E2E encryption (PEM format)
  schema JSONB NOT NULL,                      -- { fields: [{ name, type, label, required, options?, placeholder?, secret? }] }
  metadata JSONB DEFAULT '{}',                -- Internal metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL,                   -- account_id that created the intake
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status-based queries
CREATE INDEX idx_intakes_status ON core_intake.intakes(status);

-- Index for TTL cleanup queries
CREATE INDEX idx_intakes_expires_at ON core_intake.intakes(expires_at) WHERE status = 'pending';

-- Composite index for common query pattern
CREATE INDEX idx_intakes_status_expires ON core_intake.intakes(status, expires_at) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE core_intake.intakes ENABLE ROW LEVEL SECURITY;

-- Grant schema usage to service_role
GRANT USAGE ON SCHEMA core_intake TO service_role;

-- Service role has full access to the intakes table
GRANT ALL ON core_intake.intakes TO service_role;

-- Function to cleanup expired intakes (can be called by pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION core_intake.cleanup_expired_intakes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE core_intake.intakes
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an intake is still valid (not expired, pending, exists)
CREATE OR REPLACE FUNCTION core_intake.is_intake_valid(p_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT status, expires_at INTO v_status, v_expires_at
  FROM core_intake.intakes
  WHERE id = p_id;

  IF v_status IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_status = 'pending' AND v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE core_intake.intakes IS 'Ephemeral intake sessions with TTL-based expiration';
COMMENT ON COLUMN core_intake.intakes.public_key IS 'RSA public key (PEM) for end-to-end encryption of secret fields';
COMMENT ON COLUMN core_intake.intakes.schema IS 'Form schema: { fields: [{ name, type, label, required, options?, placeholder?, secret? }] }';
COMMENT ON COLUMN core_intake.intakes.metadata IS 'Internal metadata: { target_account_id, channel_id, action }';
