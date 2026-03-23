-- Migration: 002_create_submissions_table.sql
-- Create submissions table for storing completed intake form data

-- Submissions table (stores form data after completion)
CREATE TABLE core_intake.submissions (
  id TEXT PRIMARY KEY,                      -- Format: sub_abc123 (nanoid)
  intake_id TEXT NOT NULL,                  -- Reference to the intake
  payload JSONB NOT NULL,                   -- Encrypted form data
  submitted_at TIMESTAMPTZ DEFAULT NOW(),   -- When form was submitted
  expires_at TIMESTAMPTZ NOT NULL            -- When submission data expires
);

-- Index for looking up submission by intake ID
CREATE INDEX idx_submissions_intake_id ON core_intake.submissions(intake_id);

-- Index for expiration cleanup queries
CREATE INDEX idx_submissions_expires_at ON core_intake.submissions(expires_at);

-- Enable Row Level Security
ALTER TABLE core_intake.submissions ENABLE ROW LEVEL SECURITY;

-- Grant service role full access
GRANT USAGE ON SCHEMA core_intake TO service_role;
GRANT ALL ON core_intake.submissions TO service_role;

-- Function to cleanup expired submissions
CREATE OR REPLACE FUNCTION core_intake.cleanup_expired_submissions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM core_intake.submissions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get submission by ID
CREATE OR REPLACE FUNCTION core_intake.get_submission(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  intake_id TEXT,
  payload JSONB,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.intake_id, s.payload, s.submitted_at, s.expires_at
  FROM core_intake.submissions s
  WHERE s.id = p_id AND s.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE core_intake.submissions IS 'Stores completed intake form submissions with encrypted data';
COMMENT ON COLUMN core_intake.submissions.payload IS 'Encrypted form data as JSONB';
COMMENT ON COLUMN core_intake.submissions.expires_at IS 'When this submission data expires and can be deleted';
