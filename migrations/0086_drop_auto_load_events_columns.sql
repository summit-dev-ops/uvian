-- Drop deprecated auto_load_events columns
-- Part 3/3: Remove old columns after migration confirmed

-- Drop views that depend on auto_load_events
DROP VIEW IF EXISTS core_automation.v_agent_mcps_with_secrets;
DROP VIEW IF EXISTS core_automation.v_agent_skills;

-- Drop deprecated columns
ALTER TABLE core_automation.mcps DROP COLUMN IF EXISTS auto_load_events;
ALTER TABLE core_automation.skills DROP COLUMN IF EXISTS auto_load_events;

-- Recreate views without auto_load_events
CREATE VIEW core_automation.v_agent_mcps_with_secrets AS
SELECT
    am.agent_id,
    am.is_default,
    m.id AS mcp_id,
    m.name AS mcp_name,
    m.url AS mcp_url,
    m.auth_method,
    m.usage_guidance AS mcp_usage_guidance,
    s.id AS secret_id,
    s.encrypted_value AS secret_encrypted_value
FROM core_automation.agent_mcps am
INNER JOIN core_automation.mcps m ON am.mcp_id = m.id
LEFT JOIN public.secrets s ON am.secret_id = s.id;

GRANT SELECT ON core_automation.v_agent_mcps_with_secrets TO authenticated, service_role;

CREATE VIEW core_automation.v_agent_skills AS
SELECT
    ags.agent_id,
    s.id AS skill_id,
    s.name,
    s.description,
    s.content,
    s.is_private,
    ags.config AS link_config
FROM core_automation.agent_skills ags
JOIN core_automation.skills s ON s.id = ags.skill_id AND s.is_active = true;

GRANT SELECT ON core_automation.v_agent_skills TO authenticated, service_role;