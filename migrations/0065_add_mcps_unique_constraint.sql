-- =============================================================================
-- PHASE 65: ADD UNIQUE CONSTRAINT ON MCPS(account_id, name)
-- Migration: 0065_add_mcps_unique_constraint.sql
-- Purpose:
--   Enable ON CONFLICT upserts on mcps table using (account_id, name)
--   This is required by the MCP bootstrap logic in agents.routes.ts and
--   the agent-bootstrap service
-- =============================================================================

-- First remove any duplicate rows that would prevent the constraint
DELETE FROM core_automation.mcps a
USING core_automation.mcps b
WHERE a.id > b.id
  AND a.account_id = b.account_id
  AND a.name = b.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mcps_account_id_name
  ON core_automation.mcps(account_id, name);
