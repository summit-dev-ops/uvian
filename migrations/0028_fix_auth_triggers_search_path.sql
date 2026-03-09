-- =============================================================================
-- Migration: 0028_fix_auth_triggers_search_path
-- Purpose: Fix user signup triggers to use proper search_path per Supabase docs
-- Issue: Signup fails with 500 error because triggers cannot access auth.users properly
-- Fix: Use search_path = '' and fully-qualified table names per official docs
-- =============================================================================

-- Fix handle_new_user function
-- Uses search_path = '' and public. prefix for all tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  INSERT INTO public.accounts (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'name', 'Personal'))
  RETURNING id INTO new_account_id;

  INSERT INTO public.account_members (account_id, user_id, role)
  VALUES (new_account_id, NEW.id, '{"name": "owner"}');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix handle_settings_creation function
DROP TRIGGER IF EXISTS on_auth_user_settings ON auth.users;
DROP FUNCTION IF EXISTS public.handle_settings_creation();

CREATE OR REPLACE FUNCTION public.handle_settings_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.settings (user_id, settings)
  VALUES (NEW.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_settings_creation();

-- Fix handle_profile_creation function
DROP TRIGGER IF EXISTS on_auth_user_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_profile_creation();

CREATE OR REPLACE FUNCTION public.handle_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_creation();
