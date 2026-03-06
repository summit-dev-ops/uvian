-- Add attachments column to post views
-- Migration: 0025_add_attachments_to_post_views.sql
-- Purpose: Include attachments column in post views

-- Update get_posts_for_space view to include attachments
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
  pr.avatar_url as author_avatar_url,
  p.attachments
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);

-- Update get_post_details view to include attachments
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
  s.avatar_url as space_avatar_url,
  p.attachments
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
LEFT JOIN spaces s ON p.space_id = s.id
WHERE p.space_id IN (
  SELECT space_id FROM space_members WHERE user_id = auth.uid()
);
