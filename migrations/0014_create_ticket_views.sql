-- =============================================================================
-- PHASE 14: TICKET VIEWS (Using Resource Scopes)
-- Migration: 0014_create_ticket_views.sql
-- Purpose: Views for ticket queries using resource_scope access pattern
-- =============================================================================

-- =============================================================================
-- VIEW: get_tickets_for_current_user
-- Returns all tickets the current user can access via resource_scopes
-- =============================================================================

CREATE OR REPLACE VIEW public.get_tickets_for_current_user AS
SELECT 
  t.id,
  t.thread_id,
  t.resource_scope_id,
  t.requester_job_id,
  t.status,
  t.priority,
  t.title,
  t.description,
  t.resolution_payload,
  t.assigned_to,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  rs.space_id,
  rs.conversation_id,
  -- Requester profile info
  pt.user_id as requester_user_id
FROM tickets t
INNER JOIN resource_scopes rs ON t.resource_scope_id = rs.id
LEFT JOIN process_threads pt ON t.thread_id = pt.id
LEFT JOIN space_members sm ON rs.space_id = sm.space_id AND sm.user_id = auth.uid()
LEFT JOIN conversation_members cm ON rs.conversation_id = cm.conversation_id AND cm.user_id = auth.uid()
WHERE sm.user_id IS NOT NULL 
   OR cm.user_id IS NOT NULL
   OR t.assigned_to = auth.uid();

-- =============================================================================
-- VIEW: get_tickets_for_space
-- Returns tickets for a specific space (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_tickets_for_space AS
SELECT 
  t.id,
  t.thread_id,
  t.resource_scope_id,
  t.requester_job_id,
  t.status,
  t.priority,
  t.title,
  t.description,
  t.resolution_payload,
  t.assigned_to,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  rs.space_id,
  rs.conversation_id,
  pt.user_id as requester_user_id
FROM tickets t
INNER JOIN resource_scopes rs ON t.resource_scope_id = rs.id
LEFT JOIN process_threads pt ON t.thread_id = pt.id
WHERE rs.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_ticket_details
-- Returns single ticket with full details (filter by id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_ticket_details AS
SELECT 
  t.id,
  t.thread_id,
  t.resource_scope_id,
  t.requester_job_id,
  t.status,
  t.priority,
  t.title,
  t.description,
  t.resolution_payload,
  t.assigned_to,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  rs.space_id,
  rs.conversation_id,
  pt.user_id as requester_user_id,
  -- Assigned user profile
  pu.display_name as assigned_to_display_name,
  pu.avatar_url as assigned_to_avatar_url,
  -- Requester profile
  ru.display_name as requester_display_name,
  ru.avatar_url as requester_avatar_url
FROM tickets t
INNER JOIN resource_scopes rs ON t.resource_scope_id = rs.id
LEFT JOIN process_threads pt ON t.thread_id = pt.id
LEFT JOIN profiles pu ON t.assigned_to = pu.user_id
LEFT JOIN profiles ru ON pt.user_id = ru.user_id
WHERE rs.space_id IN (
    SELECT space_id FROM space_members WHERE user_id = auth.uid()
  )
  OR rs.conversation_id IN (
    SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
  )
  OR t.assigned_to = auth.uid();
