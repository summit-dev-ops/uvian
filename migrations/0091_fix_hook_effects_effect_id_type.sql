-- Change hook_effects.effect_id from UUID to TEXT
-- This allows expect_tool_call effects to store pattern strings (e.g., "discord_send_channel")
-- while still supporting UUID references for load_mcp/load_skill effects

-- Drop the dependent view first
DROP VIEW IF EXISTS core_automation.v_agent_hooks_for_worker;

-- Change the column type
ALTER TABLE core_automation.hook_effects
ALTER COLUMN effect_id TYPE TEXT;

-- Recreate the view
CREATE VIEW core_automation.v_agent_hooks_for_worker AS
SELECT
    ah.agent_id,
    h.id AS hook_id,
    h.account_id,
    h.name,
    h.trigger_json,
    h.action AS hook_action,
    h.config AS hook_config,
    h.is_active,
    he.effect_type,
    he.effect_id,
    he.config AS effect_config
FROM core_automation.hooks h
INNER JOIN core_automation.agent_hooks ah ON h.id = ah.hook_id
LEFT JOIN core_automation.hook_effects he ON h.id = he.hook_id
WHERE h.is_active = true;

GRANT SELECT ON core_automation.v_agent_hooks_for_worker TO authenticated, service_role;