-- =============================================================================
-- PHASE 5: SPACES + MEMBERS
-- Migration: 0004_create_spaces.sql
-- Purpose: Create spaces and space_members with auth.users FKs
-- =============================================================================

-- =============================================================================
-- SPACES TABLE
-- =============================================================================

CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cover_url TEXT,
  cover_image_url TEXT,
  main_image_url TEXT
);

-- =============================================================================
-- SPACE MEMBERS TABLE
-- =============================================================================

CREATE TABLE space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role JSONB DEFAULT '{"name": "member"}',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

-- Space policies
CREATE POLICY "Public spaces are viewable by everyone"
  ON spaces FOR SELECT
  USING (is_private = false);

CREATE POLICY "Members can view their private spaces"
  ON spaces FOR SELECT
  USING (
    is_private = true 
    AND id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create spaces"
  ON spaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Space admins can update"
  ON spaces FOR UPDATE
  USING (
    id IN (
      SELECT sm.space_id FROM space_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.role->>'name' = 'admin'
    )
  );

CREATE POLICY "Space owners or admins can delete"
  ON spaces FOR DELETE
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT sm.space_id FROM space_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.role->>'name' = 'admin'
    )
  );

-- Space member policies
CREATE POLICY "Users can view space members"
  ON space_members FOR SELECT
  USING (
    space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join spaces"
  ON space_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can leave spaces"
  ON space_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Space admins can remove members"
  ON space_members FOR DELETE
  USING (
    space_id IN (
      SELECT sm.space_id FROM space_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.role->>'name' = 'admin'
    )
  );
