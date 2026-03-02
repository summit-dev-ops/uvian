-- =============================================================================
-- PHASE 17: ASSET STORAGE INFRASTRUCTURE
-- Migration: 0017_create_assets_storage.sql
-- Purpose: Create storage bucket for assets with RLS policies
-- =============================================================================

-- =============================================================================
-- CREATE ASSETS BUCKET
-- =============================================================================

-- Only specify id and name - bucket defaults to private
INSERT INTO storage.buckets (id, name)
VALUES ('assets', 'assets')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- Allow authenticated users to upload to assets bucket
-- Account/folder validation is done in the API layer before returning upload path
CREATE POLICY "Authenticated users can upload to assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets'
);

-- Allow account members to read from their account's folder
CREATE POLICY "Account members can view assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assets'
  AND (storage.foldername(name))[1] = 'accounts'
  AND (storage.foldername(name))[2] IN (
    SELECT am.account_id::text 
    FROM account_members am 
    WHERE am.user_id = auth.uid()
  )
);

-- Allow account members to delete their own uploads
-- owner_id is stored as text, need to cast auth.uid() for comparison
CREATE POLICY "Account members can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets'
  AND owner_id = (SELECT auth.uid()::text)
);

-- Allow account owner or admins to delete any file in account
CREATE POLICY "Account admins can delete any asset"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets'
  AND (storage.foldername(name))[1] = 'accounts'
  AND (storage.foldername(name))[2] IN (
    SELECT am.account_id::text 
    FROM account_members am 
    WHERE am.user_id = auth.uid()
    AND am.role->>'name' IN ('owner', 'admin')
  )
);
