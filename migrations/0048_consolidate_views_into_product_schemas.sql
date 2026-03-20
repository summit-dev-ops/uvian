-- =============================================================================
-- PHASE 48: CONSOLIDATE VIEWS INTO PRODUCT SCHEMAS
-- Migration: 0048_consolidate_views_into_product_schemas.sql
-- Purpose: Move job/ticket views to core_automation, drop orphaned public views,
-- and create table-level RLS policies so views enforce per-user access.
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: DROP ORPHANED PUBLIC VIEWS
-- =============================================================================
DROP VIEW IF EXISTS public.get_subscription_providers_for_resource;
DROP VIEW IF EXISTS public.get_my_automaton_providers;
DROP VIEW IF EXISTS public.get_my_agent_configs;

-- =============================================================================
-- STEP 2: MOVE/CREATE JOB VIEWS IN core_automation (idempotent)
-- =============================================================================
DROP VIEW IF EXISTS public.get_jobs_for_current_user;
CREATE OR REPLACE VIEW core_automation.get_jobs_for_current_user AS
  SELECT j.*
  FROM core_automation.jobs j
  JOIN core_automation.process_threads t ON t.id = j.thread_id
  WHERE t.user_id = auth.uid();

DROP VIEW IF EXISTS public.get_job_details;
CREATE OR REPLACE VIEW core_automation.get_job_details AS
  SELECT
    j.id,
    j.type,
    j.status,
    j.input,
    j.output,
    j.error_message,
    j.thread_id,
    j.agent_id,
    j.input_type,
    j.created_at,
    j.updated_at,
    j.started_at,
    j.completed_at,
    t.user_id as owner_id,
    t.current_status as thread_status
  FROM core_automation.jobs j
  LEFT JOIN core_automation.process_threads t ON t.id = j.thread_id;

-- =============================================================================
-- STEP 3: MOVE/CREATE TICKET VIEWS IN core_automation (idempotent)
-- =============================================================================
DROP VIEW IF EXISTS public.get_tickets_for_current_user;
CREATE OR REPLACE VIEW core_automation.get_tickets_for_current_user AS
  SELECT t.*
  FROM core_automation.tickets t
  WHERE t.assigned_to = auth.uid()
     OR t.thread_id IN (
       SELECT id FROM core_automation.process_threads WHERE user_id = auth.uid()
     );

-- =============================================================================
-- STEP 4: ENABLE RLS ON BASE TABLES (idempotent)
-- =============================================================================
ALTER TABLE core_automation.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_automation.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_automation.process_threads ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 5: CREATE TABLE-LEVEL POLICIES
-- These policies enforce that users can only SELECT jobs/tickets related to
-- process_threads they own, or tickets assigned to them.
-- =============================================================================

-- Jobs: allow SELECT only for jobs whose thread belongs to the current user
DROP POLICY IF EXISTS "Users can view their own jobs" ON core_automation.jobs;
CREATE POLICY "Users can view their own jobs"
  ON core_automation.jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core_automation.process_threads t
      WHERE t.id = core_automation.jobs.thread_id
        AND t.user_id = auth.uid()
    )
  );

-- Tickets: allow SELECT when assigned_to = current user OR thread belongs to user
DROP POLICY IF EXISTS "Users can view their own tickets" ON core_automation.tickets;
CREATE POLICY "Users can view their own tickets"
  ON core_automation.tickets
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core_automation.process_threads t
      WHERE t.id = core_automation.tickets.thread_id
        AND t.user_id = auth.uid()
    )
  );

-- Optionally: add INSERT/UPDATE/DELETE policies (commented placeholders)
-- Uncomment and adapt if you want to allow authenticated users to insert/update/delete,
-- ensuring appropriate WITH CHECK / USING expressions are applied.

-- -- Jobs INSERT example (ensure thread belongs to user)
-- DROP POLICY IF EXISTS "Users can insert jobs for their threads" ON core_automation.jobs;
-- CREATE POLICY "Users can insert jobs for their threads"
--   ON core_automation.jobs
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM core_automation.process_threads t
--       WHERE t.id = core_automation.jobs.thread_id
--         AND t.user_id = auth.uid()
--     )
--   );

-- -- Tickets UPDATE example (allow change if assigned_to = user or they own the thread)
-- DROP POLICY IF EXISTS "Users can update their tickets" ON core_automation.tickets;
-- CREATE POLICY "Users can update their tickets"
--   ON core_automation.tickets
--   FOR UPDATE
--   TO authenticated
--   USING (
--     assigned_to = auth.uid()
--     OR EXISTS (
--       SELECT 1 FROM core_automation.process_threads t
--       WHERE t.id = core_automation.tickets.thread_id
--         AND t.user_id = auth.uid()
--     )
--   )
--   WITH CHECK (
--     assigned_to = auth.uid()
--     OR EXISTS (
--       SELECT 1 FROM core_automation.process_threads t
--       WHERE t.id = core_automation.tickets.thread_id
--         AND t.user_id = auth.uid()
--     )
--   );

COMMIT;