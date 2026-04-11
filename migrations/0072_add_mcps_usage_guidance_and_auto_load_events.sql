-- Add is_default, usage_guidance and auto_load_events to support data-driven MCP configuration
-- - is_default: always load these MCPs regardless of event type
-- - usage_guidance: human-readable description for the MCP (shown to agent)
-- - auto_load_events: event types that trigger this MCP to be auto-loaded

-- 1. Add is_default column to agent_mcps table (per-agent default MCPs)
ALTER TABLE core_automation.agent_mcps 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 2. Add usage_guidance column to mcps table (global MCP description)
ALTER TABLE core_automation.mcps 
ADD COLUMN IF NOT EXISTS usage_guidance TEXT;

-- 3. Add auto_load_events column to mcps table (global event type triggers)
ALTER TABLE core_automation.mcps 
ADD COLUMN IF NOT EXISTS auto_load_events TEXT[] DEFAULT '{}';

-- 4. Drop and recreate the view with all new columns (DROP required due to column order changes)
DROP VIEW IF EXISTS core_automation.v_agent_mcps_with_secrets;

CREATE VIEW core_automation.v_agent_mcps_with_secrets AS
SELECT 
    am.agent_id,
    am.is_default,
    m.id AS mcp_id,
    m.name AS mcp_name,
    m.url AS mcp_url,
    m.auth_method,
    m.usage_guidance AS mcp_usage_guidance,
    m.auto_load_events AS mcp_auto_load_events,
    s.id AS secret_id,
    s.encrypted_value AS secret_encrypted_value
FROM core_automation.agent_mcps am
INNER JOIN core_automation.mcps m ON am.mcp_id = m.id
LEFT JOIN public.secrets s ON am.secret_id = s.id;

-- 5. Grant permissions
GRANT SELECT ON core_automation.v_agent_mcps_with_secrets TO authenticated, service_role;