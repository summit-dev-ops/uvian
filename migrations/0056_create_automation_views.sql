-- 1. View for Agent LLMs + Secrets
CREATE OR REPLACE VIEW core_automation.v_agent_llms_with_secrets AS
SELECT 
    al.agent_id,
    al.is_default,
    l.id AS llm_id,
    l.name AS llm_name,
    l.type AS llm_type,
    l.model_name,
    l.base_url,
    l.temperature,
    s.id AS secret_id,
    s.encrypted_value AS secret_encrypted_value
FROM core_automation.agent_llms al
INNER JOIN core_automation.llms l ON al.llm_id = l.id
LEFT JOIN public.secrets s ON al.secret_id = s.id;

-- Ensure PostgREST permissions for the view
GRANT SELECT ON core_automation.v_agent_llms_with_secrets TO authenticated, service_role;


-- 2. View for Agent MCPs + Secrets
CREATE OR REPLACE VIEW core_automation.v_agent_mcps_with_secrets AS
SELECT 
    am.agent_id,
    am.is_default, -- Included if you track default MCPs
    m.id AS mcp_id,
    m.name AS mcp_name,
    m.url AS mcp_url,
    m.auth_method,
    s.id AS secret_id,
    s.encrypted_value AS secret_encrypted_value
FROM core_automation.agent_mcps am
INNER JOIN core_automation.mcps m ON am.mcp_id = m.id
LEFT JOIN public.secrets s ON am.secret_id = s.id;

-- Ensure PostgREST permissions for the view
GRANT SELECT ON core_automation.v_agent_mcps_with_secrets TO authenticated, service_role;

CREATE OR REPLACE FUNCTION core_automation.link_agent_llm(
    p_agent_id UUID,
    p_llm_id UUID,
    p_account_id UUID,
    p_is_default BOOLEAN,
    p_secret_name TEXT,
    p_encrypted_secret TEXT
) RETURNS void AS $$
DECLARE
    v_secret_id UUID := NULL;
BEGIN
    -- If a secret is provided, insert it into the public schema
    IF p_encrypted_secret IS NOT NULL THEN
        INSERT INTO public.secrets (account_id, name, value_type, encrypted_value, is_active)
        VALUES (p_account_id, p_secret_name, 'text', p_encrypted_secret, true)
        RETURNING id INTO v_secret_id;
    END IF;

    -- If this is the default LLM, unset existing defaults
    IF p_is_default THEN
        UPDATE core_automation.agent_llms 
        SET is_default = false 
        WHERE agent_id = p_agent_id;
    END IF;

    -- Insert the link in the core_automation schema
    INSERT INTO core_automation.agent_llms (agent_id, llm_id, secret_id, is_default)
    VALUES (p_agent_id, p_llm_id, v_secret_id, p_is_default);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION core_automation.link_agent_mcp(
    p_agent_id UUID,
    p_mcp_id UUID,
    p_account_id UUID,
    p_secret_name TEXT,
    p_encrypted_secret TEXT
) RETURNS void AS $$
DECLARE
    v_secret_id UUID := NULL;
BEGIN
    -- 1. If a secret is provided, insert it into the public schema first
    IF p_encrypted_secret IS NOT NULL THEN
        INSERT INTO public.secrets (account_id, name, value_type, encrypted_value, is_active)
        VALUES (p_account_id, COALESCE(p_secret_name, 'MCP Auth Config'), 'text', p_encrypted_secret, true)
        RETURNING id INTO v_secret_id;
    END IF;

    -- 2. Insert the link in the core_automation schema
    INSERT INTO core_automation.agent_mcps (agent_id, mcp_id, secret_id)
    VALUES (p_agent_id, p_mcp_id, v_secret_id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION core_automation.update_agent_mcp_link(
    p_agent_id UUID,
    p_mcp_id UUID,
    p_account_id UUID,
    p_is_default BOOLEAN,
    p_encrypted_secret TEXT
) RETURNS void AS $$
DECLARE
    v_existing_secret_id UUID;
    v_new_secret_id UUID;
BEGIN
    -- 1. Handle is_default logic if it is being set to true
    IF p_is_default IS TRUE THEN
        UPDATE core_automation.agent_mcps
        SET is_default = false
        WHERE agent_id = p_agent_id;
    END IF;

    -- 2. Handle secret update or insert
    IF p_encrypted_secret IS NOT NULL THEN
        -- Check if a secret already exists for this link
        SELECT secret_id INTO v_existing_secret_id
        FROM core_automation.agent_mcps
        WHERE agent_id = p_agent_id AND mcp_id = p_mcp_id;

        IF v_existing_secret_id IS NOT NULL THEN
            -- Update the existing secret in the public schema
            UPDATE public.secrets
            SET encrypted_value = p_encrypted_secret
            WHERE id = v_existing_secret_id;
        ELSE
            -- Insert a new secret in the public schema
            INSERT INTO public.secrets (account_id, name, value_type, encrypted_value, is_active)
            VALUES (p_account_id, 'MCP Auth Config', 'text', p_encrypted_secret, true)
            RETURNING id INTO v_new_secret_id;
            
            -- We must also update the link to point to this new secret
            UPDATE core_automation.agent_mcps
            SET secret_id = v_new_secret_id
            WHERE agent_id = p_agent_id AND mcp_id = p_mcp_id;
        END IF;
    END IF;

    -- 3. Finally, update the link's own properties (like is_default)
    IF p_is_default IS NOT NULL THEN
        UPDATE core_automation.agent_mcps
        SET is_default = p_is_default
        WHERE agent_id = p_agent_id AND mcp_id = p_mcp_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;