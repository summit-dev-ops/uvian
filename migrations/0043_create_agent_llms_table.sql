-- Create agent_llms join table in core_automation schema
-- Many-to-many relationship between agents and LLMs

CREATE TABLE core_automation.agent_llms (
    agent_id UUID NOT NULL REFERENCES core_automation.agents(id) ON DELETE CASCADE,
    llm_id UUID NOT NULL REFERENCES core_automation.llms(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, llm_id)
);

CREATE INDEX idx_agent_llms_llm_id ON core_automation.agent_llms(llm_id);

ALTER TABLE core_automation.agent_llms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own agent_llms"
    ON core_automation.agent_llms FOR SELECT
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Owner can manage own agent_llms"
    ON core_automation.agent_llms FOR ALL
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Service role full access"
    ON core_automation.agent_llms FOR ALL
    USING (true) WITH CHECK (true);
