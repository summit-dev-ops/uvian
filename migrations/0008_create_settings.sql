-- =============================================================================
-- PHASE 9: SETTINGS
-- Migration: 0008_create_settings.sql
-- Purpose: Create settings table with auth.users FK
-- =============================================================================

-- =============================================================================
-- SETTINGS TABLE
-- =============================================================================

CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TRIGGER: AUTO-CREATE SETTINGS ON USER SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_settings_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO settings (user_id, settings)
  VALUES (NEW.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_settings_creation();
