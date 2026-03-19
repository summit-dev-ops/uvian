-- Create automation schema and move tables from public
-- Dropping resource_scopes dependency

CREATE SCHEMA IF NOT EXISTS automation;

-- Move process_threads (drop resource_scope_id column)
CREATE TABLE automation.process_threads AS
  SELECT id, user_id, current_status, metadata, created_at, updated_at
  FROM public.process_threads;
ALTER TABLE automation.process_threads ADD PRIMARY KEY (id);
ALTER TABLE automation.process_threads ADD FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE automation.process_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own threads" ON automation.process_threads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access" ON automation.process_threads FOR ALL USING (true) WITH CHECK (true);

-- Move jobs (drop resource_scope_id column)
CREATE TABLE automation.jobs AS
  SELECT id, type, status, input, output, error_message, thread_id, agent_id, input_type, created_at, updated_at, started_at, completed_at
  FROM public.jobs;
ALTER TABLE automation.jobs ADD PRIMARY KEY (id);
ALTER TABLE automation.jobs ADD FOREIGN KEY (thread_id) REFERENCES automation.process_threads(id);
ALTER TABLE automation.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON automation.jobs FOR ALL USING (true) WITH CHECK (true);

-- Move tickets (drop resource_scope_id column)
CREATE TABLE automation.tickets AS
  SELECT id, thread_id, requester_job_id, status, priority, title, description, resolution_payload, assigned_to, created_at, updated_at, resolved_at
  FROM public.tickets;
ALTER TABLE automation.tickets ADD PRIMARY KEY (id);
ALTER TABLE automation.tickets ADD FOREIGN KEY (thread_id) REFERENCES automation.process_threads(id);
ALTER TABLE automation.tickets ADD FOREIGN KEY (requester_job_id) REFERENCES automation.jobs(id);
ALTER TABLE automation.tickets ADD FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
ALTER TABLE automation.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON automation.tickets FOR ALL USING (true) WITH CHECK (true);

-- Move automation_agent_keys
CREATE TABLE automation.automation_agent_keys AS SELECT * FROM public.automation_agent_keys;
ALTER TABLE automation.automation_agent_keys ADD PRIMARY KEY (id);
ALTER TABLE automation.automation_agent_keys ADD FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE automation.automation_agent_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON automation.automation_agent_keys FOR ALL USING (true) WITH CHECK (true);

-- Drop old tables from public (CASCADE drops dependent FKs, indexes, policies)
DROP TABLE public.process_threads CASCADE;
DROP TABLE public.jobs CASCADE;
DROP TABLE public.tickets CASCADE;
DROP TABLE public.automation_agent_keys CASCADE;
