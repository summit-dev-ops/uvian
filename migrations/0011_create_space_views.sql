-- =============================================================================
-- PHASE 11: SPACE VIEWS
-- Migration: 0011_create_space_views.sql
-- Purpose: Views for space-related queries
-- =============================================================================

-- =============================================================================
-- VIEW: get_spaces_for_current_user
-- Returns spaces the current user is a member of
-- =============================================================================

CREATE OR REPLACE VIEW public.get_spaces_for_current_user AS
SELECT 
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  s.cover_image_url,
  s.main_image_url,
  sm.role as user_role,
  -- Member count
  (
    SELECT COUNT(*)::int 
    FROM space_members sm2 
    WHERE sm2.space_id = s.id
  ) as member_count,
  -- Conversation count
  (
    SELECT COUNT(*)::int 
    FROM conversations c 
    WHERE c.space_id = s.id
  ) as conversation_count
FROM spaces s
INNER JOIN space_members sm ON s.id = sm.space_id
WHERE sm.user_id = auth.uid()
ORDER BY s.updated_at DESC;

-- =============================================================================
-- VIEW: get_space_members
-- Returns members of a space (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_space_members AS
SELECT 
  sm.id,
  sm.space_id,
  sm.user_id,
  sm.role,
  sm.joined_at,
  p.display_name,
  p.avatar_url,
  p.bio,
  -- Get email from auth.users
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = sm.user_id),
    ''
  ) as email
FROM space_members sm
INNER JOIN profiles p ON sm.user_id = p.user_id
WHERE sm.space_id IN (
  SELECT space_id 
  FROM space_members 
  WHERE user_id = auth.uid()
);

-- =============================================================================
-- VIEW: get_space_details
-- Returns single space with full details (filter by space_id in query)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_space_details AS
SELECT 
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  s.cover_image_url,
  s.main_image_url,
  -- Get creator's profile
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  -- Member count
  (
    SELECT COUNT(*)::int 
    FROM space_members sm2 
    WHERE sm2.space_id = s.id
  ) as member_count,
  -- Conversation count
  (
    SELECT COUNT(*)::int 
    FROM conversations c 
    WHERE c.space_id = s.id
  ) as conversation_count,
  -- Current user's role (if member)
  (
    SELECT sm.role::text 
    FROM space_members sm 
    WHERE sm.space_id = s.id AND sm.user_id = auth.uid()
  ) as user_role
FROM spaces s
LEFT JOIN profiles cp ON s.created_by = cp.user_id
WHERE s.id IN (
  SELECT space_id 
  FROM space_members 
  WHERE user_id = auth.uid()
  UNION
  SELECT id FROM spaces WHERE is_private = false
);

-- =============================================================================
-- VIEW: get_public_spaces
-- Returns all public spaces (for discovery)
-- =============================================================================

CREATE OR REPLACE VIEW public.get_public_spaces AS
SELECT 
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int 
    FROM space_members sm2 
    WHERE sm2.space_id = s.id
  ) as member_count,
  (
    SELECT COUNT(*)::int 
    FROM conversations c 
    WHERE c.space_id = s.id
  ) as conversation_count
FROM spaces s
LEFT JOIN profiles cp ON s.created_by = cp.user_id
WHERE s.is_private = false
ORDER BY s.updated_at DESC;
