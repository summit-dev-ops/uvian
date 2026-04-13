-- =============================================================================
-- PHASE 75: REMOVE REDUNDANT JOB COLUMNS
-- Migration: 0075_remove_redundant_job_columns.sql
-- Purpose: Remove redundant columns from jobs table (thread_id, agent_id, input_type)
--           These values are already available in the JSONB input column.
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DROP VIEWS THAT REFERENCE DROPPED COLUMNS
-- =============================================================================
DROP VIEW IF EXISTS core_automation.get_job_details;
DROP VIEW IF EXISTS core_automation.get_jobs_for_current_user;

-- =============================================================================
-- STEP 2: DROP RLS POLICIES REFERENCING THREAD_ID
-- =============================================================================
DROP POLICY IF EXISTS "Users can view their own jobs" ON core_automation.jobs;
DROP POLICY IF EXISTS "Users can view their own job details" ON core_automation.jobs;

-- =============================================================================
-- STEP 3: DROP REDUNDANT COLUMNS
-- =============================================================================
ALTER TABLE core_automation.jobs DROP COLUMN IF EXISTS thread_id;
ALTER TABLE core_automation.jobs DROP COLUMN IF EXISTS agent_id;
ALTER TABLE core_automation.jobs DROP COLUMN IF EXISTS input_type;
ALTER TABLE core_automation.jobs DROP COLUMN IF EXISTS resource_scope_id;

-- =============================================================================
-- STEP 4: RECREATE VIEWS WITHOUT DROPPED COLUMNS
-- =============================================================================
-- View for listing jobs (filtered by thread ownership via input JSON)
CREATE OR REPLACE VIEW core_automation.get_jobs_for_current_user AS
  SELECT j.*
  FROM core_automation.jobs j
  WHERE (j.input->>'threadId')::uuid IN (
    SELECT id FROM core_automation.process_threads WHERE user_id = auth.uid()
  );

-- View for job details (no thread ownership check, service role only)
CREATE OR REPLACE VIEW core_automation.get_job_details AS
  SELECT
    j.id,
    j.type,
    j.status,
    j.input,
    j.output,
    j.error_message,
    j.created_at,
    j.updated_at,
    j.started_at,
    j.completed_at,
    t.user_id as owner_id,
    t.current_status as thread_status
  FROM core_automation.jobs j
  LEFT JOIN core_automation.process_threads t ON t.id = (j.input->>'threadId')::uuid;

-- =============================================================================
-- STEP 5: RECREATE RLS POLICIES (use input JSON for ownership)
-- =============================================================================
CREATE POLICY "Users can view their own jobs"
  ON core_automation.jobs
  FOR SELECT
  USING (
    (input->>'threadId')::uuid IN (
      SELECT id FROM core_automation.process_threads WHERE user_id = auth.uid()
    )
  );

-- Allow service role full access
CREATE POLICY "Service role full access on jobs"
  ON core_automation.jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMIT;