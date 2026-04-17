-- Extend tickets for tool approval workflow
-- Add tool approval specific fields and pending status

-- Add tool approval fields
ALTER TABLE core_automation.tickets
ADD COLUMN IF NOT EXISTS tool_name TEXT,
ADD COLUMN IF NOT EXISTS tool_call_id UUID,
ADD COLUMN IF NOT EXISTS approve_subsequent BOOLEAN DEFAULT false;

-- Add pending status
ALTER TABLE core_automation.tickets
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE core_automation.tickets
ADD CONSTRAINT tickets_status_check CHECK (
    status IN ('open', 'in_progress', 'pending', 'resolved', 'cancelled')
);

-- Update existing tickets with pending status that have tool_name
-- (these are tool approval tickets that were awaiting approval)

-- Create view for pending tool approvals
CREATE OR REPLACE VIEW core_automation.v_pending_tool_approvals AS
SELECT id, thread_id, tool_name, tool_call_id, title, created_at
FROM core_automation.tickets
WHERE status = 'pending' AND tool_name IS NOT NULL;

GRANT SELECT ON core_automation.v_pending_tool_approvals TO authenticated, service_role;