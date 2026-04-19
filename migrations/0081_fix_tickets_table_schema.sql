-- =============================================================================
-- Fix tickets table: remove thread_id dependency, add defaults
-- =============================================================================

-- 1. Update get_tickets_for_current_user view - remove thread_id dependency
DROP VIEW IF EXISTS core_automation.get_tickets_for_current_user;
CREATE OR REPLACE VIEW core_automation.get_tickets_for_current_user AS
SELECT t.*
FROM core_automation.tickets t
WHERE t.assigned_to = auth.uid();

-- 2. Update RLS policy - remove thread_id dependency
DROP POLICY IF EXISTS "Users can view their own tickets" ON core_automation.tickets;
CREATE POLICY "Users can view their own tickets"
  ON core_automation.tickets
  FOR SELECT
  USING (assigned_to = auth.uid());

-- 3. Update v_pending_tool_approvals view - read from content column
DROP VIEW IF EXISTS core_automation.v_pending_tool_approvals;
CREATE OR REPLACE VIEW core_automation.v_pending_tool_approvals AS
SELECT id, title, created_at
FROM core_automation.tickets
WHERE status = 'pending' AND content IS NOT NULL AND content->>'toolName' IS NOT NULL;

GRANT SELECT ON core_automation.v_pending_tool_approvals TO authenticated, service_role;

-- 4. Add DEFAULT values for missing columns
ALTER TABLE core_automation.tickets
ALTER COLUMN status SET DEFAULT 'open';

ALTER TABLE core_automation.tickets
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE core_automation.tickets
ALTER COLUMN updated_at SET DEFAULT now();

-- 5. Drop thread_id column (CASCADE drops dependent objects)
ALTER TABLE core_automation.tickets DROP COLUMN IF EXISTS thread_id CASCADE;
