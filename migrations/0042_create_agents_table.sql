-- Create agents table in core_automation schema
-- Stores agent runtime configurations for the automation system
-- Fully owned by the automation system (distinct from public.agent_configs)

CREATE TABLE core_automation.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    system_prompt TEXT,
    max_conversation_history INT DEFAULT 50,
    skills JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agents_owner_user_id ON core_automation.agents(owner_user_id);
CREATE INDEX idx_agents_owner_active ON core_automation.agents(owner_user_id, is_active);

ALTER TABLE core_automation.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own agents"
    ON core_automation.agents FOR SELECT
    USING (owner_user_id = auth.uid());

CREATE POLICY "Owner can update own agents"
    ON core_automation.agents FOR UPDATE
    USING (owner_user_id = auth.uid());

CREATE POLICY "Service role full access"
    ON core_automation.agents FOR ALL
    USING (true) WITH CHECK (true);

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON core_automation.agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
