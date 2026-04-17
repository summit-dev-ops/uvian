-- Additional hook view for agent-based retrieval
-- Returns hooks linked to an agent for worker consumption

CREATE OR REPLACE VIEW core_automation.v_agent_hooks_for_worker AS
SELECT 
    ah.agent_id,
    h.id AS hook_id,
    h.account_id,
    h.name,
    h.trigger_json,
    h.action,
    h.config,
    h.is_active
FROM core_automation.agent_hooks ah
INNER JOIN core_automation.hooks h ON ah.hook_id = h.id
WHERE h.is_active = true;

GRANT SELECT ON core_automation.v_agent_hooks_for_worker TO authenticated, service_role;