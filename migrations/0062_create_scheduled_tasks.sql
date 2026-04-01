-- Create scheduled_tasks table for the scheduler API
-- This table stores scheduled tasks that will be processed by the cron worker

CREATE TABLE IF NOT EXISTS core_automation.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES core_automation.agents(id),
  description TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one_time', 'recurring')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  cron_expression VARCHAR(100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'completed', 'cancelled', 'failed')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  job_id UUID REFERENCES core_automation.jobs(id),
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE core_automation.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own schedules
CREATE POLICY "Users manage own schedules" ON core_automation.scheduled_tasks
  FOR ALL USING (user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access" ON core_automation.scheduled_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Index for efficient querying of pending schedules in time window
CREATE INDEX idx_scheduled_tasks_pending_window 
  ON core_automation.scheduled_tasks(status, scheduled_for) 
  WHERE status = 'pending';

-- Index for user-based queries
CREATE INDEX idx_scheduled_tasks_user_id 
  ON core_automation.scheduled_tasks(user_id);

-- Index for agent_id lookups
CREATE INDEX idx_scheduled_tasks_agent_id 
  ON core_automation.scheduled_tasks(agent_id);

-- Index for job_id lookups
CREATE INDEX idx_scheduled_tasks_job_id 
  ON core_automation.scheduled_tasks(job_id);

-- Grant necessary permissions
GRANT SELECT ON core_automation.scheduled_tasks TO authenticated, service_role;
GRANT INSERT ON core_automation.scheduled_tasks TO authenticated, service_role;
GRANT UPDATE ON core_automation.scheduled_tasks TO authenticated, service_role;
GRANT DELETE ON core_automation.scheduled_tasks TO authenticated, service_role;