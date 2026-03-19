-- Rename owner_user_id to user_id in core_automation.agents
-- Standardizes column naming with other user-owned tables

ALTER TABLE core_automation.agents RENAME COLUMN owner_user_id TO user_id;

-- Rename indexes to match new column name
DROP INDEX IF EXISTS idx_agents_owner_user_id;
DROP INDEX IF EXISTS idx_agents_owner_active;
CREATE INDEX idx_agents_user_id ON core_automation.agents(user_id);
CREATE INDEX idx_agents_user_active ON core_automation.agents(user_id, is_active);

-- Update RLS policies on agents table
DROP POLICY IF EXISTS "Owner can view own agents" ON core_automation.agents;
DROP POLICY IF EXISTS "Owner can update own agents" ON core_automation.agents;
CREATE POLICY "Owner can view own agents"
    ON core_automation.agents FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY "Owner can update own agents"
    ON core_automation.agents FOR UPDATE
    USING (user_id = auth.uid());

-- Update RLS policies on agent_llms (subquery references agents.user_id)
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

-- Update RLS policies on agent_mcps (subquery references agents.user_id)
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
