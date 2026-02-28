-- =============================================================================
-- PHASE 13: JOB VIEWS (Using Resource Scopes)
-- Migration: 0013_create_job_views.sql
-- Purpose: Views for job queries using resource_scope access pattern
-- =============================================================================

-- =============================================================================
-- VIEW: get_jobs_for_current_user
-- Returns all jobs the current user can access via resource_scopes
-- =============================================================================

CREATE OR REPLACE VIEW public.get_jobs_for_current_user AS
SELECT 
  j.id,
  j.type,
  j.status,
  j.input,
  j.output,
  j.error_message,
  j.resource_scope_id,
  j.thread_id,
  j.created_at,
  j.updated_at,
  j.started_at,
  j.completed_at,
  rs.space_id,
  rs.conversation_id
FROM jobs j
INNER JOIN resource_scopes rs ON j.resource_scope_id = rs.id
LEFT JOIN space_members sm ON rs.space_id = sm.space_id AND sm.user_id = auth.uid()
LEFT JOIN conversation_members cm ON rs.conversation_id = cm.conversation_id AND cm.user_id = auth.uid()
WHERE sm.user_id IS NOT NULL OR cm.user_id IS NOT NULL;

-- =============================================================================
-- VIEW: get_jobs_for_space
-- Returns jobs for a specific space (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_jobs_for_space AS
SELECT 
  j.id,
  j.type,
  j.status,
  j.input,
  j.output,
  j.error_message,
  j.resource_scope_id,
  j.thread_id,
  j.created_at,
  j.updated_at,
  j.started_at,
  j.completed_at,
  rs.space_id,
  rs.conversation_id
FROM jobs j
INNER JOIN resource_scopes rs ON j.resource_scope_id = rs.id
WHERE rs.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_jobs_for_conversation
-- Returns jobs for a specific conversation (filter by conversation_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_jobs_for_conversation AS
SELECT 
  j.id,
  j.type,
  j.status,
  j.input,
  j.output,
  j.error_message,
  j.resource_scope_id,
  j.thread_id,
  j.created_at,
  j.updated_at,
  j.started_at,
  j.completed_at,
  rs.space_id,
  rs.conversation_id
FROM jobs j
INNER JOIN resource_scopes rs ON j.resource_scope_id = rs.id
WHERE rs.conversation_id IN (
  SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_job_details
-- Returns single job with full details (filter by id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_job_details AS
SELECT 
  j.id,
  j.type,
  j.status,
  j.input,
  j.output,
  j.error_message,
  j.resource_scope_id,
  j.thread_id,
  j.created_at,
  j.updated_at,
  j.started_at,
  j.completed_at,
  rs.space_id,
  rs.conversation_id,
  pt.current_status as thread_status,
  pt.metadata as thread_metadata,
  pt.user_id as thread_user_id
FROM jobs j
INNER JOIN resource_scopes rs ON j.resource_scope_id = rs.id
LEFT JOIN process_threads pt ON j.thread_id = pt.id
WHERE rs.space_id IN (
    SELECT space_id FROM space_members WHERE user_id = auth.uid()
  )
  OR rs.conversation_id IN (
    SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
  );

-- =============================================================================
-- VIEW: get_jobs_metrics_for_space
-- Returns job metrics for a space (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_jobs_metrics_for_space AS
SELECT 
  rs.space_id,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE j.status = 'queued') as queued,
  COUNT(*) FILTER (WHERE j.status = 'processing') as processing,
  COUNT(*) FILTER (WHERE j.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE j.status = 'failed') as failed,
  COUNT(*) FILTER (WHERE j.status = 'cancelled') as cancelled,
  AVG(EXTRACT(EPOCH FROM (j.completed_at - j.started_at))) as avg_processing_time_seconds
FROM jobs j
INNER JOIN resource_scopes rs ON j.resource_scope_id = rs.id
WHERE rs.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
)
GROUP BY rs.space_id;
