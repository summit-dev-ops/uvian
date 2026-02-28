-- =============================================================================
-- PHASE 4: CONVERSATIONS + MEMBERS
-- Migration: 0003_create_conversations.sql
-- Purpose: Create conversations and conversation_members with auth.users FKs
-- =============================================================================

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  space_id UUID,  -- nullable: direct messages not in spaces
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- CONVERSATION MEMBERS TABLE
-- =============================================================================

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role JSONB DEFAULT '{"name": "member"}',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Members can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Conversation admins can delete"
  ON conversations FOR DELETE
  USING (
    id IN (
      SELECT cm.conversation_id FROM conversation_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role->>'name' = 'admin'
    )
  );

-- Conversation member policies
CREATE POLICY "Users can view conversation members"
  ON conversation_members FOR SELECT
  USING (
    conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join conversations"
  ON conversation_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave conversations"
  ON conversation_members FOR DELETE
  USING (user_id = auth.uid());
