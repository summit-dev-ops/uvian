-- =============================================================================
-- PHASE 18: ASSETS TABLE
-- Migration: 0018_create_assets_table.sql
-- Purpose: Create assets table for file storage management
-- =============================================================================

-- =============================================================================
-- ASSETS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  uploader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  storage_type TEXT CHECK (storage_type IN ('supabase', 'external')) DEFAULT 'supabase',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Users can view assets in their account
CREATE POLICY "Users can view account assets"
ON assets FOR SELECT
USING (
  account_id IN (
    SELECT am.account_id FROM account_members am WHERE am.user_id = auth.uid()
  )
);
