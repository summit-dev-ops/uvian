-- Create hooks table
-- Account-level hook definitions with trigger/action for generic governance

CREATE TABLE core_automation.hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_json JSONB NOT NULL,  -- {"type": "tool_name_prefix", "pattern": "http_*"}
    action TEXT NOT NULL CHECK (action IN ('interrupt', 'log', 'block')),
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hooks_account_id ON core_automation.hooks(account_id);
CREATE INDEX idx_hooks_account_active ON core_automation.hooks(account_id, is_active);

ALTER TABLE core_automation.hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members can view hooks"
    ON core_automation.hooks FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Account admins can manage hooks"
    ON core_automation.hooks FOR ALL
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE TRIGGER update_hooks_updated_at
    BEFORE UPDATE ON core_automation.hooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create agent_hooks table
-- Agent-level hook links (mirrors agent_mcps pattern)

CREATE TABLE core_automation.agent_hooks (
    agent_id UUID NOT NULL REFERENCES core_automation.agents(id) ON DELETE CASCADE,
    hook_id UUID NOT NULL REFERENCES core_automation.hooks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, hook_id)
);

CREATE INDEX idx_agent_hooks_hook_id ON core_automation.agent_hooks(hook_id);

ALTER TABLE core_automation.agent_hooks ENABLE ROW LEVEL SECURITY;

-- RLS for agent_hooks (mirrors agent_mcps)
CREATE POLICY "Owner can view own agent_hooks"
    ON core_automation.agent_hooks FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM core_automation.agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owner can manage own agent_hooks"
    ON core_automation.agent_hooks FOR ALL
    USING (
        agent_id IN (
            SELECT id FROM core_automation.agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access agent_hooks"
    ON core_automation.agent_hooks FOR ALL
    USING (true) WITH CHECK (true);

-- View: hooks with config for agent execution
CREATE OR REPLACE VIEW core_automation.v_agent_hooks_with_config AS
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

GRANT SELECT ON core_automation.v_agent_hooks_with_config TO authenticated, service_role;

-- Linking function (mirrors link_agent_mcp)
CREATE OR REPLACE FUNCTION core_automation.link_agent_hook(
    p_agent_id UUID,
    p_hook_id UUID
) RETURNS void AS $$
BEGIN
    INSERT INTO core_automation.agent_hooks (agent_id, hook_id)
    VALUES (p_agent_id, p_hook_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlinking function
CREATE OR REPLACE FUNCTION core_automation.unlink_agent_hook(
    p_agent_id UUID,
    p_hook_id UUID
) RETURNS void AS $$
BEGIN
    DELETE FROM core_automation.agent_hooks
    WHERE agent_id = p_agent_id AND hook_id = p_hook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;