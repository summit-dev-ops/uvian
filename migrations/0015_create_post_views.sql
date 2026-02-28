-- =============================================================================
-- PHASE 15: POST VIEWS
-- Migration: 0015_create_post_views.sql
-- Purpose: Views for post queries using space membership
-- =============================================================================

-- =============================================================================
-- VIEW: get_posts_for_space
-- Returns posts for a specific space (filter by space_id in query)
-- Includes author profile info
-- =============================================================================

CREATE OR REPLACE VIEW public.get_posts_for_space AS
SELECT 
  p.id,
  p.space_id,
  p.user_id,
  p.content_type,
  p.content,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_post_details
-- Returns single post with full details (filter by id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_post_details AS
SELECT 
  p.id,
  p.space_id,
  p.user_id,
  p.content_type,
  p.content,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url,
  pr.bio as author_bio,
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
LEFT JOIN spaces s ON p.space_id = s.id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);
