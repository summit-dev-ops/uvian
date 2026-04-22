-- Add expect_tool_call effect type to hook system
-- Updates view to include effect_type and effect_id for each row
-- This ensures get_agent_hooks in worker returns consistent data

DROP VIEW IF EXISTS core_automation.v_agent_hooks_for_worker;

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
GRANT SELECT ON core_automation.hook_effects TO authenticated, service_role;