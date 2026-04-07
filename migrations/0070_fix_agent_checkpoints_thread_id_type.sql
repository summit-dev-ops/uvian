-- =============================================================================
-- MIGRATION 0070: Fix agent_checkpoints thread_id type
-- =============================================================================
-- Purpose: Change agent_checkpoints.thread_id from UUID to VARCHAR(32) to support
--          16-char hex thread IDs used by the thread-driven architecture.
-- =============================================================================

-- Change thread_id column type from UUID to VARCHAR(36) to support both
-- existing 36-char UUIDs and new 16-char hex thread IDs
ALTER TABLE core_automation.agent_checkpoints
  ALTER COLUMN thread_id TYPE VARCHAR(36);
