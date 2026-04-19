-- =============================================================================
-- Consolidate ticket metadata into single content JSONB column
-- =============================================================================

-- 1. Add content column
ALTER TABLE core_automation.tickets ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}';

-- 2. Copy existing data from legacy columns to content
UPDATE core_automation.tickets
SET content = jsonb_build_object(
    'toolName', tool_name,
    'toolCallId', tool_call_id,
    'approveSubsequent', approve_subsequent,
    'resolution', resolution_payload
) WHERE content = '{}'::jsonb OR content IS NULL;

-- 3. Drop legacy columns (data already moved to content) - CASCADE to drop dependent views
ALTER TABLE core_automation.tickets DROP COLUMN IF EXISTS tool_name CASCADE;
ALTER TABLE core_automation.tickets DROP COLUMN IF EXISTS tool_call_id CASCADE;
ALTER TABLE core_automation.tickets DROP COLUMN IF EXISTS approve_subsequent CASCADE;
ALTER TABLE core_automation.tickets DROP COLUMN IF EXISTS resolution_payload CASCADE;

-- 4. Set Default for content column
ALTER TABLE core_automation.tickets ALTER COLUMN content SET DEFAULT '{}';

-- 5. Recreate get_tickets_for_current_user view (was dropped by CASCADE)
DROP VIEW IF EXISTS core_automation.get_tickets_for_current_user;
CREATE OR REPLACE VIEW core_automation.get_tickets_for_current_user AS
SELECT *
FROM core_automation.tickets
WHERE assigned_to = auth.uid();

-- 6. Recreate v_pending_tool_approvals view (was dropped by CASCADE above)
DROP VIEW IF EXISTS core_automation.v_pending_tool_approvals;
CREATE OR REPLACE VIEW core_automation.v_pending_tool_approvals AS
SELECT id, title, created_at
FROM core_automation.tickets
WHERE status = 'pending' AND content IS NOT NULL AND content->>'toolName' IS NOT NULL;

GRANT SELECT ON core_automation.v_pending_tool_approvals TO authenticated, service_role;