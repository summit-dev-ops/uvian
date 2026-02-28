-- =============================================================================
-- PHASE 3: ACCOUNTS + AUTH USERS
-- Migration: 0002_create_accounts.sql
-- Purpose: Create accounts table and link to auth.users
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ACCOUNTS TABLE
-- =============================================================================
-- Accounts are the billing/ownership container.
-- Auto-created when a user signs up via trigger.

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ACCOUNT MEMBERS TABLE
-- =============================================================================
-- Links users to accounts. A user belongs to exactly one account.

CREATE TABLE account_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role JSONB DEFAULT '{"name": "member"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- =============================================================================
-- TRIGGER: AUTO-CREATE ACCOUNT ON USER SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create account for new user
  INSERT INTO accounts (name)
  VALUES (COALESCE(
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = NEW.id),
    'Personal'
  ))
  RETURNING id INTO new_account_id;

  -- Link user to account as owner
  INSERT INTO account_members (account_id, user_id, role)
  VALUES (new_account_id, NEW.id, '{"name": "owner"}');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- Account policies
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

-- Account member policies
CREATE POLICY "Users can view account members"
  ON account_members FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get current user's account
CREATE OR REPLACE FUNCTION public.get_my_account()
RETURNS TABLE(id UUID, name TEXT, settings JSONB, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, a.settings, a.created_at
  FROM accounts a
  INNER JOIN account_members am ON a.id = am.account_id
  WHERE am.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get account_id for current user
CREATE OR REPLACE FUNCTION public.get_my_account_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT account_id
    FROM account_members
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
