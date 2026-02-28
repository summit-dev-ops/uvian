-- =============================================================================
-- PHASE 6: MESSAGES
-- Migration: 0005_create_messages.sql
-- Purpose: Create messages table with auth.users FK
-- =============================================================================

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Message policies
CREATE POLICY "Members can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Message senders can update their messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Message senders can delete their messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());
