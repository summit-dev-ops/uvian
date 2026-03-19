-- Rename automation schema to core_automation and move agent_checkpoints

-- Step 1: Rename the schema
ALTER SCHEMA automation RENAME TO core_automation;

-- Step 2: Move agent_checkpoints from public to core_automation
-- The table was created in 0006 and never populated (0 rows)
ALTER TABLE public.agent_checkpoints SET SCHEMA core_automation;

-- Step 3: Add service_role-only RLS policy for agent_checkpoints
-- No user-facing access needed; only automation worker (service_role) accesses it
ALTER TABLE core_automation.agent_checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON core_automation.agent_checkpoints
  FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Grant service_role access to agent_checkpoints
GRANT ALL ON core_automation.agent_checkpoints TO service_role;
