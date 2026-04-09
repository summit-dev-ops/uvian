-- =============================================================================
-- PHASE 71: ADD SCHEDULE EXECUTION TRACKING
-- Migration: 0071_add_schedule_execution_tracking.sql
-- Purpose:
--   1. Add last_executed_at and last_successful_executed_at columns
--   2. Add indexes for efficient querying
-- =============================================================================

-- =============================================================================
-- STEP 1: Add execution tracking columns
-- =============================================================================

ALTER TABLE core_scheduler.schedules 
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_successful_executed_at TIMESTAMPTZ;

-- =============================================================================
-- STEP 2: Add indexes for efficient querying
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_schedules_last_executed 
ON core_scheduler.schedules(last_executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedules_last_successful 
ON core_scheduler.schedules(last_successful_executed_at DESC);