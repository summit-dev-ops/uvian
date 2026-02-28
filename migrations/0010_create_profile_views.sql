-- =============================================================================
-- PHASE 10: PROFILE & ACCOUNT VIEWS
-- Migration: 0010_create_profile_views.sql
-- Purpose: Views for user-specific data retrieval
-- =============================================================================

-- =============================================================================
-- VIEW: get_my_profile
-- Returns current user's profile
-- =============================================================================

CREATE OR REPLACE VIEW public.get_my_profile AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.created_at,
  p.updated_at,
  -- Get user metadata from auth.users
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = p.user_id),
    ''
  ) as email
FROM profiles p
WHERE p.user_id = auth.uid();

-- =============================================================================
-- VIEW: get_my_account
-- Returns current user's account
-- =============================================================================

CREATE OR REPLACE VIEW public.get_my_account AS
SELECT 
  a.id,
  a.name,
  a.settings,
  a.created_at,
  a.updated_at,
  am.role as user_role
FROM accounts a
INNER JOIN account_members am ON a.id = am.account_id
WHERE am.user_id = auth.uid();

-- =============================================================================
-- VIEW: get_my_settings
-- Returns current user's settings
-- =============================================================================

CREATE OR REPLACE VIEW public.get_my_settings AS
SELECT 
  s.user_id,
  s.settings,
  s.created_at,
  s.updated_at
FROM settings s
WHERE s.user_id = auth.uid();

-- =============================================================================
-- VIEW: get_account_members
-- Returns all members of current user's account
-- =============================================================================

CREATE OR REPLACE VIEW public.get_account_members AS
SELECT 
  am.id,
  am.account_id,
  am.user_id,
  am.role,
  am.created_at,
  p.display_name,
  p.avatar_url
FROM account_members am
INNER JOIN accounts a ON am.account_id = a.id
LEFT JOIN profiles p ON am.user_id = p.user_id
WHERE a.id IN (
  SELECT account_id 
  FROM account_members 
  WHERE user_id = auth.uid()
);
