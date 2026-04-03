-- =============================================================================
-- PHASE 63: CORE SCHEDULER SCHEMA + SCHEDULES TABLE
-- Migration: 0063_create_core_scheduler.sql
-- Purpose:
--   1. Drop the old scheduled_tasks table from core_automation
--   2. Create a new core_scheduler schema for separation of concerns
--   3. Create the schedules table with support for one-time and recurring schedules
--   4. Schedules emit CloudEvents — no direct job creation
-- =============================================================================

-- =============================================================================
-- STEP 1: Drop old scheduled_tasks from core_automation
-- =============================================================================

DROP TABLE IF EXISTS core_automation.scheduled_tasks CASCADE;

-- =============================================================================
-- STEP 2: Create core_scheduler schema
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS core_scheduler;

-- =============================================================================
-- STEP 3: Create schedules table
-- =============================================================================

CREATE TABLE core_scheduler.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
  start TIMESTAMPTZ,
  "end" TIMESTAMPTZ,
  cron_expression VARCHAR(100),
  next_run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  event_data JSONB NOT NULL DEFAULT '{}',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- RLS: schedules
-- =============================================================================

ALTER TABLE core_scheduler.schedules ENABLE ROW LEVEL SECURITY;

-- Users manage their own schedules
CREATE POLICY "Users manage own schedules" ON core_scheduler.schedules
  FOR ALL USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access" ON core_scheduler.schedules
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Efficient querying of active schedules due in the next cron window
CREATE INDEX idx_schedules_active_next_run 
  ON core_scheduler.schedules(status, next_run_at) 
  WHERE status = 'active';

-- User-based queries
CREATE INDEX idx_schedules_user_id 
  ON core_scheduler.schedules(user_id);

-- =============================================================================
-- STEP 4: Trigger to auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION core_scheduler.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_update_updated_at
  BEFORE UPDATE ON core_scheduler.schedules
  FOR EACH ROW
  EXECUTE FUNCTION core_scheduler.update_updated_at();

-- =============================================================================
-- STEP 5: Grants
-- =============================================================================

GRANT USAGE ON SCHEMA core_scheduler TO authenticated, service_role;
GRANT ALL ON core_scheduler.schedules TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core_scheduler.update_updated_at() TO authenticated, service_role;
