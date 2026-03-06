-- =============================================================================
-- PHASE 26: NOTES TABLE
-- Migration: 0026_create_notes_table.sql
-- Purpose: Create notes table and update posts for new pointer types
-- =============================================================================

-- =============================================================================
-- DROP DEPENDENT VIEWS
-- =============================================================================

DROP VIEW IF EXISTS get_posts_for_space;
DROP VIEW IF EXISTS get_post_details;

-- =============================================================================
-- NOTES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- UPDATE POSTS TABLE
-- =============================================================================

-- Drop the old content_type column (no longer needed)
ALTER TABLE posts DROP COLUMN IF EXISTS content_type;
ALTER TABLE posts DROP COLUMN IF EXISTS content;

-- Add new columns for pointer types
ALTER TABLE posts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('asset', 'note', 'external'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS url TEXT;

-- Rename user_id to author_id for clarity
ALTER TABLE posts RENAME COLUMN user_id TO author_id;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_space_id ON notes(space_id);
CREATE INDEX IF NOT EXISTS idx_notes_owner_user_id ON notes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_asset_id ON posts(asset_id);
CREATE INDEX IF NOT EXISTS idx_posts_note_id ON posts(note_id);

-- =============================================================================
-- RECREATE POST VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.get_posts_for_space AS
SELECT 
  p.id,
  p.space_id,
  p.author_id,
  p.type,
  p.asset_id,
  p.note_id,
  p.url,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.user_id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

CREATE OR REPLACE VIEW public.get_post_details AS
SELECT 
  p.id,
  p.space_id,
  p.author_id,
  p.type,
  p.asset_id,
  p.note_id,
  p.url,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url,
  pr.bio as author_bio,
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.author_id = pr.user_id
LEFT JOIN spaces s ON p.space_id = s.id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes in their spaces
CREATE POLICY "Users can view notes in their spaces"
ON notes FOR SELECT
USING (
  space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
);

-- Space members can create notes
CREATE POLICY "Space members can create notes"
ON notes FOR INSERT
WITH CHECK (
  owner_user_id = auth.uid()
  AND space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
);

-- Note owners can update their notes
CREATE POLICY "Note owners can update their notes"
ON notes FOR UPDATE
USING (owner_user_id = auth.uid());

-- Note owners can delete their notes
CREATE POLICY "Note owners can delete their notes"
ON notes FOR DELETE
USING (owner_user_id = auth.uid());

-- Update post policies to use author_id
DROP POLICY IF EXISTS "Space members can create posts" ON posts;

CREATE POLICY "Space members can create posts"
ON posts FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
);
