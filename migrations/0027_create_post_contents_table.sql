-- =============================================================================
-- PHASE 27: POST CONTENTS TABLE
-- Migration: 0027_create_post_contents_table.sql
-- Purpose: Create post_contents table for storing post content as memberships
-- =============================================================================

-- =============================================================================
-- DROP DEPENDENT VIEWS
-- =============================================================================

DROP VIEW IF EXISTS get_posts_for_space;
DROP VIEW IF EXISTS get_post_details;

-- =============================================================================
-- POST CONTENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS post_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('note', 'asset', 'external')),
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  url TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_post_contents_post_id ON post_contents(post_id);
CREATE INDEX IF NOT EXISTS idx_post_contents_note_id ON post_contents(note_id);
CREATE INDEX IF NOT EXISTS idx_post_contents_asset_id ON post_contents(asset_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE post_contents ENABLE ROW LEVEL SECURITY;

-- Users can view post contents for posts in their spaces
CREATE POLICY "Users can view post contents" ON post_contents FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM posts 
      WHERE space_id IN (
        SELECT space_id FROM space_members WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- REMOVE OLD COLUMNS FROM POSTS
-- =============================================================================

ALTER TABLE posts DROP COLUMN IF EXISTS type;
ALTER TABLE posts DROP COLUMN IF EXISTS note_id;
ALTER TABLE posts DROP COLUMN IF EXISTS asset_id;
ALTER TABLE posts DROP COLUMN IF EXISTS url;

-- =============================================================================
-- RECREATE POST VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.get_posts_for_space AS
SELECT 
  p.id,
  p.space_id,
  p.author_id,
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
