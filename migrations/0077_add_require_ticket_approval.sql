-- Add require_ticket_approval to agent_mcps
-- Per-agent MCP link configuration for tool governance

ALTER TABLE core_automation.agent_mcps
ADD COLUMN IF NOT EXISTS require_ticket_approval BOOLEAN DEFAULT false;