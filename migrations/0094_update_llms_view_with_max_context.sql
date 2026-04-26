-- =============================================================================
-- Migration: 0094_update_llms_view_with_max_context.sql
-- Purpose: Add max_context_size to v_agent_llms_with_secrets view
-- =============================================================================

DROP VIEW IF EXISTS core_automation.v_agent_llms_with_secrets;

CREATE VIEW core_automation.v_agent_llms_with_secrets AS
SELECT
    al.agent_id,
    al.is_default,
    l.id AS llm_id,
    l.name AS llm_name,
    l.type AS llm_type,
    l.model_name,
    l.base_url,
    l.temperature,
    l.max_context_size,
    l.config AS config,
    s.id AS secret_id,
    s.encrypted_value AS secret_encrypted_value
FROM core_automation.agent_llms al
INNER JOIN core_automation.llms l ON al.llm_id = l.id
LEFT JOIN public.secrets s ON al.secret_id = s.id;

GRANT SELECT ON core_automation.v_agent_llms_with_secrets TO authenticated, service_role;