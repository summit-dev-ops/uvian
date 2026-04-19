-- =============================================================================
-- Add created_by column to tickets for access control
-- =============================================================================

-- 1. Add created_by column
ALTER TABLE core_automation.tickets ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Update existing tickets without created_by (set to assigned_to if available)
UPDATE core_automation.tickets 
SET created_by = assigned_to 
WHERE created_by IS NULL AND assigned_to IS NOT NULL;

-- 3. Recreate get_tickets_for_current_user view with created_by access
DROP VIEW IF EXISTS core_automation.get_tickets_for_current_user;
CREATE OR REPLACE VIEW core_automation.get_tickets_for_current_user AS
SELECT * FROM core_automation.tickets 
WHERE assigned_to = auth.uid() OR created_by = auth.uid();
