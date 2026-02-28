-- =============================================================================
-- PHASE 12: CONVERSATION VIEWS
-- Migration: 0012_create_conversation_views.sql
-- Purpose: Views for conversation and message queries
-- =============================================================================

-- =============================================================================
-- VIEW: get_conversations_for_current_user
-- Returns conversations the current user is a member of
-- =============================================================================

CREATE OR REPLACE VIEW public.get_conversations_for_current_user AS
SELECT 
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  cm.role as user_role,
  -- Message count
  (
    SELECT COUNT(*)::int 
    FROM messages m 
    WHERE m.conversation_id = c.id
  ) as message_count,
  -- Last message (most recent)
  (
    SELECT m.content 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ) as last_message,
  -- Unread count (for future use - messages created after user's last read)
  0 as unread_count,
  -- Get space info if in a space
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM conversations c
INNER JOIN conversation_members cm ON c.id = cm.conversation_id
LEFT JOIN spaces s ON c.space_id = s.id
WHERE cm.user_id = auth.uid()
ORDER BY c.updated_at DESC;

-- =============================================================================
-- VIEW: get_conversation_members
-- Returns members of a conversation (filter by conversation_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_conversation_members AS
SELECT 
  cm.id,
  cm.conversation_id,
  cm.user_id,
  cm.role,
  cm.joined_at,
  p.display_name,
  p.avatar_url,
  p.bio,
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = cm.user_id),
    ''
  ) as email
FROM conversation_members cm
INNER JOIN profiles p ON cm.user_id = p.user_id
WHERE cm.conversation_id IN (
  SELECT conversation_id 
  FROM conversation_members 
  WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_conversation_messages
-- Returns messages in a conversation (filter by conversation_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_conversation_messages AS
SELECT 
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.role,
  m.metadata,
  m.created_at,
  m.updated_at,
  p.display_name as sender_display_name,
  p.avatar_url as sender_avatar_url
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.user_id
WHERE m.conversation_id IN (
  SELECT conversation_id 
  FROM conversation_members 
  WHERE user_id = auth.uid()
)
ORDER BY m.created_at ASC;

-- =============================================================================
-- VIEW: get_conversation_details
-- Returns single conversation with full details (filter by conversation_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_conversation_details AS
SELECT 
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  -- Get creator's profile
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  -- Message count
  (
    SELECT COUNT(*)::int 
    FROM messages m2 
    WHERE m2.conversation_id = c.id
  ) as message_count,
  -- Member count
  (
    SELECT COUNT(*)::int 
    FROM conversation_members cm2 
    WHERE cm2.conversation_id = c.id
  ) as member_count,
  -- Current user's role
  (
    SELECT cm.role::text 
    FROM conversation_members cm 
    WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()
  ) as user_role,
  -- Space info
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM conversations c
LEFT JOIN profiles cp ON c.created_by = cp.user_id
LEFT JOIN spaces s ON c.space_id = s.id
WHERE c.id IN (
  SELECT conversation_id 
  FROM conversation_members 
  WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_conversations_for_space
-- Returns all conversations in a space (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_conversations_for_space AS
SELECT 
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int 
    FROM messages m2 
    WHERE m2.conversation_id = c.id
  ) as message_count,
  (
    SELECT COUNT(*)::int 
    FROM conversation_members cm2 
    WHERE cm2.conversation_id = c.id
  ) as member_count
FROM conversations c
LEFT JOIN profiles cp ON c.created_by = cp.user_id
WHERE c.space_id IN (
  SELECT space_id 
  FROM space_members 
  WHERE user_id = auth.uid()
)
ORDER BY c.updated_at DESC;
