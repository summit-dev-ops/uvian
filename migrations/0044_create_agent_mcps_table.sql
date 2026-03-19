-- Create agent_mcps join table in core_automation schema
-- Many-to-many relationship between agents and MCP servers

CREATE TABLE core_automation.agent_mcps (
    agent_id UUID NOT NULL REFERENCES core_automation.agents(id) ON DELETE CASCADE,
    mcp_id UUID NOT NULL REFERENCES core_automation.mcps(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, mcp_id)
);

CREATE INDEX idx_agent_mcps_mcp_id ON core_automation.agent_mcps(mcp_id);

ALTER TABLE core_automation.agent_mcps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own agent_mcps"
    ON core_automation.agent_mcps FOR SELECT
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Owner can manage own agent_mcps"
    ON core_automation.agent_mcps FOR ALL
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Service role full access"
    ON core_automation.agent_mcps FOR ALL
    USING (true) WITH CHECK (true);
