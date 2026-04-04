-- Create skills catalog and agent_skills membership table
-- Skills are owned by accounts, can be private or shared across accounts
-- Content is structured JSON mimicking a folder/file hierarchy

-- Skills catalog
CREATE TABLE core_automation.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL,
    auto_load_events TEXT[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_skills_account_name ON core_automation.skills(account_id, name);
CREATE INDEX idx_skills_is_private ON core_automation.skills(is_private);
CREATE INDEX idx_skills_is_active ON core_automation.skills(is_active);

-- Agent-skill membership (mirrors agent_mcps pattern)
CREATE TABLE core_automation.agent_skills (
    agent_id UUID NOT NULL REFERENCES core_automation.agents(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES core_automation.skills(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, skill_id)
);

CREATE INDEX idx_agent_skills_skill_id ON core_automation.agent_skills(skill_id);

-- View: agent skills with full skill data
CREATE VIEW core_automation.v_agent_skills AS
SELECT
    ag.id AS agent_id,
    ag.account_id,
    s.id AS skill_id,
    s.name,
    s.description,
    s.content,
    s.auto_load_events,
    s.is_private,
    ags.config AS link_config
FROM core_automation.agent_skills ags
JOIN core_automation.skills s ON s.id = ags.skill_id AND s.is_active = true
JOIN core_automation.agents ag ON ag.id = ags.agent_id;

-- RLS for skills
ALTER TABLE core_automation.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account skills"
    ON core_automation.skills FOR SELECT
    USING (
        account_id IN (SELECT account_id FROM core_automation.agents WHERE user_id = auth.uid())
        OR (is_private = false AND is_active = true)
    );

CREATE POLICY "Users can manage own account skills"
    ON core_automation.skills FOR ALL
    USING (
        account_id IN (SELECT account_id FROM core_automation.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role full access to skills"
    ON core_automation.skills FOR ALL
    USING (true) WITH CHECK (true);

-- RLS for agent_skills
ALTER TABLE core_automation.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent skills"
    ON core_automation.agent_skills FOR SELECT
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own agent skills"
    ON core_automation.agent_skills FOR ALL
    USING (
        agent_id IN (SELECT id FROM core_automation.agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role full access to agent_skills"
    ON core_automation.agent_skills FOR ALL
    USING (true) WITH CHECK (true);

-- Drop the deprecated inline skills column from agents
ALTER TABLE core_automation.agents DROP COLUMN IF EXISTS skills;

-- Trigger for updated_at
CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON core_automation.skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
