-- Create mcps table in core_automation schema
-- Stores MCP server configurations for the automation system

CREATE TABLE core_automation.mcps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('integrated', 'external')),
    url TEXT,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('jwt', 'bearer', 'api_key', 'none')),
    encrypted_auth_config TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcps_account_id ON core_automation.mcps(account_id);
CREATE INDEX idx_mcps_account_active ON core_automation.mcps(account_id, is_active);

ALTER TABLE core_automation.mcps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members can view mcps"
    ON core_automation.mcps FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Account admins can insert mcps"
    ON core_automation.mcps FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Account admins can update mcps"
    ON core_automation.mcps FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Account admins can delete mcps"
    ON core_automation.mcps FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role full access"
    ON core_automation.mcps FOR ALL
    USING (true) WITH CHECK (true);

CREATE TRIGGER update_mcps_updated_at
    BEFORE UPDATE ON core_automation.mcps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
