-- =============================================================================
-- PHASE 19: ASSET VIEWS
-- Migration: 0019_create_asset_views.sql
-- Purpose: Create views for asset queries
-- =============================================================================

-- =============================================================================
-- VIEW: get_my_assets
-- Returns assets for current user's account
-- =============================================================================

CREATE OR REPLACE VIEW public.get_my_assets AS
SELECT 
  a.id,
  a.account_id,
  a.uploader_user_id,
  a.type,
  a.url,
  a.filename,
  a.mime_type,
  a.file_size_bytes,
  a.storage_type,
  a.metadata,
  a.created_at,
  a.updated_at,
  p.display_name as uploader_name,
  p.avatar_url as uploader_avatar
FROM assets a
LEFT JOIN profiles p ON a.uploader_user_id = p.user_id
WHERE a.account_id IN (
  SELECT am.account_id FROM account_members am WHERE am.user_id = auth.uid()
)
ORDER BY a.created_at DESC;

-- =============================================================================
-- VIEW: get_asset_details
-- Returns single asset with full details
-- =============================================================================

CREATE OR REPLACE VIEW public.get_asset_details AS
SELECT 
  a.id,
  a.account_id,
  a.uploader_user_id,
  a.type,
  a.url,
  a.filename,
  a.mime_type,
  a.file_size_bytes,
  a.storage_type,
  a.metadata,
  a.created_at,
  a.updated_at,
  p.display_name as uploader_name,
  p.avatar_url as uploader_avatar,
  acc.name as account_name
FROM assets a
LEFT JOIN profiles p ON a.uploader_user_id = p.user_id
LEFT JOIN accounts acc ON a.account_id = acc.id
WHERE a.account_id IN (
  SELECT am.account_id FROM account_members am WHERE am.user_id = auth.uid()
);
