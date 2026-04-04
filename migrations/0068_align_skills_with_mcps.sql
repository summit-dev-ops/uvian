-- Align skills system with MCPs pattern
-- 1. Drop and recreate v_agent_skills view (remove agents join, add GRANT)
-- 2. Replace skills table RLS policies to use account_members (matching mcps)

-- ---------------------------------------------------------------------------
-- 1. Recreate v_agent_skills view to mirror v_agent_mcps_with_secrets pattern
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS core_automation.v_agent_skills;

CREATE VIEW core_automation.v_agent_skills AS
SELECT
    ags.agent_id,
    s.id AS skill_id,
    s.name,
    s.description,
    s.content,
    s.auto_load_events,
    s.is_private,
    ags.config AS link_config
FROM core_automation.agent_skills ags
JOIN core_automation.skills s ON s.id = ags.skill_id AND s.is_active = true;

-- Ensure PostgREST permissions for the view (matching MCP views)
GRANT SELECT ON core_automation.v_agent_skills TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Replace skills table RLS policies to use account_members (matching mcps)
-- ---------------------------------------------------------------------------

-- Drop existing policies that reference agents table
DROP POLICY IF EXISTS "Users can view own account skills" ON core_automation.skills;
DROP POLICY IF EXISTS "Users can manage own account skills" ON core_automation.skills;

-- SELECT: account members can view their account's skills + shared skills
CREATE POLICY "Account members can view skills"
    ON core_automation.skills FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
        OR (is_private = false AND is_active = true)
    );

-- INSERT: account admins can create skills
CREATE POLICY "Account admins can insert skills"
    ON core_automation.skills FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid()
              AND (account_members.role ->> 'name') IN ('owner', 'admin')
        )
    );

-- UPDATE: account admins can update their account's skills
CREATE POLICY "Account admins can update skills"
    ON core_automation.skills FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid()
              AND (account_members.role ->> 'name') IN ('owner', 'admin')
        )
    );

-- DELETE: account admins can delete their account's skills
CREATE POLICY "Account admins can delete skills"
    ON core_automation.skills FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid()
              AND (account_members.role ->> 'name') IN ('owner', 'admin')
        )
    );
