-- Create unified secrets table and migrate all secrets from embedded columns
-- Secrets are decoupled from configs: configs are reusable, secrets are assigned per-agent

-- 1. Create secrets table
CREATE TABLE core_automation.secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    secret_type TEXT NOT NULL CHECK (secret_type IN ('api_key', 'bearer', 'jwt', 'api_key_json')),
    encrypted_value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_secrets_account_id ON core_automation.secrets(account_id);

ALTER TABLE core_automation.secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members can view own secrets"
    ON core_automation.secrets FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Account members can manage own secrets"
    ON core_automation.secrets FOR ALL
    USING (account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role full access"
    ON core_automation.secrets FOR ALL
    USING (true) WITH CHECK (true);

CREATE TRIGGER update_secrets_updated_at
    BEFORE UPDATE ON core_automation.secrets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add secret_id to junction tables
ALTER TABLE core_automation.agent_llms
    ADD COLUMN secret_id UUID REFERENCES core_automation.secrets(id) ON DELETE SET NULL;

ALTER TABLE core_automation.agent_mcps
    ADD COLUMN secret_id UUID REFERENCES core_automation.secrets(id) ON DELETE SET NULL;

-- 3. Migrate LLM secrets → secrets table
INSERT INTO core_automation.secrets (account_id, name, secret_type, encrypted_value, metadata)
SELECT
    account_id,
    name || ' API Key',
    'api_key',
    encrypted_api_key,
    jsonb_build_object('llm_id', id)
FROM core_automation.llms
WHERE encrypted_api_key IS NOT NULL;

-- 4. Migrate MCP auth configs → secrets table
INSERT INTO core_automation.secrets (account_id, name, secret_type, encrypted_value, metadata)
SELECT
    account_id,
    name || ' Auth Config',
    CASE auth_method
        WHEN 'bearer' THEN 'bearer'
        WHEN 'api_key' THEN 'api_key'
        WHEN 'jwt' THEN 'jwt'
        ELSE 'api_key_json'
    END,
    encrypted_auth_config,
    jsonb_build_object('mcp_id', id)
FROM core_automation.mcps
WHERE encrypted_auth_config IS NOT NULL;

-- 5. Migrate automation_agent_keys → secrets table
-- These are agents' own API keys for authenticating with uvian-hub
INSERT INTO core_automation.secrets (account_id, name, secret_type, encrypted_value, metadata)
SELECT
    am.account_id,
    'Uvian Hub API Key',
    'api_key',
    aak.encrypted_api_key,
    jsonb_build_object(
        'agent_user_id', aak.user_id,
        'api_key_prefix', aak.api_key_prefix,
        'migrated_from', 'automation_agent_keys'
    )
FROM core_automation.automation_agent_keys aak
JOIN account_members am ON am.user_id = aak.user_id
WHERE aak.is_active = true;

-- 6. Drop old encrypted columns and automation_agent_keys table
ALTER TABLE core_automation.llms DROP COLUMN IF EXISTS encrypted_api_key;
ALTER TABLE core_automation.mcps DROP COLUMN IF EXISTS encrypted_auth_config;
DROP TABLE IF EXISTS core_automation.automation_agent_keys;

-- 7. Update RLS on agent_llms and agent_mcps to reference user_id
DROP POLICY IF EXISTS "Owner can view own agent_llms" ON core_automation.agent_llms;
DROP POLICY IF EXISTS "Owner can manage own agent_llms" ON core_automation.agent_llms;
CREATE POLICY "Owner can view own agent_llms"
    ON core_automation.agent_llms FOR SELECT
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner can manage own agent_llms"
    ON core_automation.agent_llms FOR ALL
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can view own agent_mcps" ON core_automation.agent_mcps;
DROP POLICY IF EXISTS "Owner can manage own agent_mcps" ON core_automation.agent_mcps;
CREATE POLICY "Owner can view own agent_mcps"
    ON core_automation.agent_mcps FOR SELECT
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner can manage own agent_mcps"
    ON core_automation.agent_mcps FOR ALL
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );
