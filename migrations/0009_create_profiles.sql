-- =============================================================================
-- PHASE 10: REINTRODUCE PROFILES (DISPLAY-ONLY)
-- Migration: 0009_create_profiles.sql
-- Purpose: Lightweight profiles table for display purposes only
-- =============================================================================

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Lightweight profiles for display purposes only.
-- NOT the identity core - identity is now auth.users.
-- One profile per user, linked via user_id.

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All profiles are readable (for discovery/display)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- TRIGGER: AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_profile ON auth.users;
CREATE TRIGGER on_auth_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_creation();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get profile by user_id
CREATE OR REPLACE FUNCTION public.get_profile_by_user_id(p_user_id UUID)
RETURNS TABLE(id UUID, user_id UUID, display_name TEXT, avatar_url TEXT, bio TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.display_name, p.avatar_url, p.bio
  FROM profiles p
  WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(id UUID, user_id UUID, display_name TEXT, avatar_url TEXT, bio TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.display_name, p.avatar_url, p.bio
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
