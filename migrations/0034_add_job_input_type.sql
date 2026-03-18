-- Add input_type column to jobs table for standardized event processing
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'manual' 
  CHECK (input_type IN ('manual', 'event', 'scheduled', 'webhook'));

-- Backfill existing jobs as 'manual' (they're user-initiated)
UPDATE jobs SET input_type = 'manual' WHERE input_type IS NULL;

-- Set existing event-triggered jobs (type = 'agent') to 'event'
UPDATE jobs SET input_type = 'event' WHERE type = 'agent' AND input_type = 'manual';

-- Add index for faster lookups by input_type
CREATE INDEX IF NOT EXISTS idx_jobs_input_type ON jobs(input_type);

-- Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_jobs_type_input_type ON jobs(type, input_type);
