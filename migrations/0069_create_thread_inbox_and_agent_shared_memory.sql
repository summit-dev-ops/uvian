-- Create thread_inbox and agent_shared_memory tables for thread-driven architecture
-- Migration from job-driven to inbox-based threading model

-- ---------------------------------------------------------------------------
-- 1. Create thread_inbox table
-- ---------------------------------------------------------------------------

CREATE TABLE core_automation.thread_inbox (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id VARCHAR(255) NOT NULL,
  agent_id uuid REFERENCES core_automation.agents(id),
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thread_inbox_thread_status 
  ON core_automation.thread_inbox(thread_id, status);

CREATE INDEX idx_thread_inbox_agent 
  ON core_automation.thread_inbox(agent_id);

CREATE INDEX idx_thread_inbox_created_at 
  ON core_automation.thread_inbox(created_at);

-- Row Level Security for thread_inbox
ALTER TABLE core_automation.thread_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to thread_inbox" 
  ON core_automation.thread_inbox FOR ALL 
  USING (true) WITH CHECK (true);

GRANT ALL ON core_automation.thread_inbox TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Create agent_shared_memory table
-- ---------------------------------------------------------------------------

CREATE TABLE core_automation.agent_shared_memory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES core_automation.agents(id),
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, key)
);

CREATE INDEX idx_agent_shared_memory_agent 
  ON core_automation.agent_shared_memory(agent_id);

-- Row Level Security for agent_shared_memory
ALTER TABLE core_automation.agent_shared_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to agent_shared_memory" 
  ON core_automation.agent_shared_memory FOR ALL 
  USING (true) WITH CHECK (true);

GRANT ALL ON core_automation.agent_shared_memory TO service_role;
