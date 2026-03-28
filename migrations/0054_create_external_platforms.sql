-- Migration: 0054_create_external_platforms.sql
-- Purpose: Create external_platforms table for managing external messaging platform connections

-- Step 1: Create external_platforms table
CREATE TABLE IF NOT EXISTS public.external_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('discord', 'slack', 'whatsapp', 'telegram', 'messenger', 'email')),
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_external_platforms_owner_user_id ON external_platforms(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_external_platforms_platform ON external_platforms(platform);

-- Step 3: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_external_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_platforms_updated_at
  BEFORE UPDATE ON external_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_external_platforms_updated_at();

-- Step 4: Enable RLS
ALTER TABLE public.external_platforms ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy - users can manage their own platforms
CREATE POLICY "Users can manage their own external platforms" ON external_platforms
  FOR ALL USING (owner_user_id = auth.uid());
