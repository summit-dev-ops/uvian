-- Create llms table in core_automation schema
-- Stores LLM provider configurations for the automation system

CREATE TABLE core_automation.llms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'openai', 'openai_responses', 'anthropic', 'google',
        'mistral', 'cohere', 'azure_openai', 'runpod', 'minimax'
    )),
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    base_url TEXT,
    encrypted_api_key TEXT,
    temperature FLOAT DEFAULT 0.6,
    max_tokens INT DEFAULT 4096,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_llms_account_id ON core_automation.llms(account_id);
CREATE INDEX idx_llms_account_active ON core_automation.llms(account_id, is_active);

ALTER TABLE core_automation.llms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members can view llms"
    ON core_automation.llms FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Account admins can insert llms"
    ON core_automation.llms FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Account admins can update llms"
    ON core_automation.llms FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Account admins can delete llms"
    ON core_automation.llms FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role full access"
    ON core_automation.llms FOR ALL
    USING (true) WITH CHECK (true);

CREATE TRIGGER update_llms_updated_at
    BEFORE UPDATE ON core_automation.llms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
