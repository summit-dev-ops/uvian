-- Add attachments column to get_conversation_messages view
-- This is needed to return attachments when fetching messages

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
  m.attachments,
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
