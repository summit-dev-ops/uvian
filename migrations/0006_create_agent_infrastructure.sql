-- =============================================================================
-- PHASE 7: AGENT INFRASTRUCTURE
-- Migration: 0006_create_agent_infrastructure.sql
-- Purpose: Create resource_scopes, process_threads, jobs, agent_checkpoints
-- =============================================================================

-- =============================================================================
-- RESOURCE SCOPES TABLE
-- =============================================================================

CREATE TABLE resource_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  environment JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- PROCESS THREADS TABLE
-- =============================================================================

CREATE TABLE process_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_scope_id UUID REFERENCES resource_scopes(id) ON DELETE CASCADE,
  current_status TEXT DEFAULT 'active' CHECK (current_status IN ('active', 'paused', 'completed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- JOBS TABLE
-- =============================================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('chat', 'task', 'agent')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  input JSONB,
  output JSONB,
  error_message TEXT,
  agent_id UUID,
  resource_scope_id UUID REFERENCES resource_scopes(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES process_threads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =============================================================================
-- AGENT CHECKPOINTS TABLE
-- =============================================================================

CREATE TABLE agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES process_threads(id) ON DELETE CASCADE,
  checkpoint_id TEXT NOT NULL,
  parent_id TEXT,
  checkpoint_data BYTEA NOT NULL,
  metadata BYTEA DEFAULT '\\x7b7d',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE resource_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;

-- Resource scope policies
CREATE POLICY "Users can view resource scopes in their spaces"
  ON resource_scopes FOR SELECT
  USING (
    space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
    OR conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

-- Process thread policies
CREATE POLICY "Users can view their threads"
  ON process_threads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create threads"
  ON process_threads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their threads"
  ON process_threads FOR UPDATE
  USING (user_id = auth.uid());

-- Job policies
CREATE POLICY "Users can view jobs in their scope"
  ON jobs FOR SELECT
  USING (
    resource_scope_id IN (
      SELECT rs.id FROM resource_scopes rs
      WHERE rs.space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
      OR rs.conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (true);

-- Agent checkpoint policies
CREATE POLICY "Users can view their checkpoints"
  ON agent_checkpoints FOR SELECT
  USING (
    thread_id IN (SELECT id FROM process_threads WHERE user_id = auth.uid())
  );
