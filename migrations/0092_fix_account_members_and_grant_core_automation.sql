-- =============================================================================
-- PHASE 0092: FIX ACCOUNT_MEMBERS POLICY + GRANT CORE_AUTOMATION ACCESS
-- Migration: 0092_fix_account_members_and_grant_core_automation.sql
-- Purpose:
--   1. Fix infinite recursion in account_members RLS policy
--   2. Grant authenticated role access to core_automation schema
-- =============================================================================

-- =============================================================================
-- STEP 1: FIX ACCOUNT_MEMBERS INFINITE RECURSION
-- The current policy references account_members in its USING clause, causing infinite recursion:
--   USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()))
-- PostgREST (authenticator role) triggers RLS, which queries account_members, triggering RLS again.
--
-- Fix: Use auth.uid() directly in USING clause - no recursive reference needed.
-- =============================================================================

DROP POLICY IF EXISTS "Users can view account members" ON account_members;

CREATE POLICY "Users can view account members"
  ON account_members FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 2: GRANT AUTHENTICATED ACCESS TO CORE_AUTOMATION SCHEMA
-- The authenticated role (via PostgREST as authenticator) needs schema-level USAGE
-- to access tables in core_automation schema.
-- =============================================================================

GRANT USAGE ON SCHEMA core_automation TO authenticated;

GRANT SELECT ON core_automation.skills TO authenticated;
GRANT SELECT ON core_automation.agent_skills TO authenticated;
GRANT SELECT ON core_automation.llms TO authenticated;
GRANT SELECT ON core_automation.agent_llms TO authenticated;
GRANT SELECT ON core_automation.mcps TO authenticated;
GRANT SELECT ON core_automation.agent_mcps TO authenticated;
GRANT SELECT ON core_automation.agents TO authenticated;
GRANT SELECT ON core_automation.agent_hooks TO authenticated;
GRANT SELECT ON core_automation.hooks TO authenticated;
GRANT SELECT ON core_automation.hook_effects TO authenticated;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- This migration:
--   1. Fixes infinite recursion on account_members by removing self-reference in RLS policy
--   2. Grants authenticated role USAGE on core_automation schema
--   3. Grants SELECT on all core_automation tables to authenticated role
--
-- Without step 1: Any query through PostgREST targeting tables that reference
-- account_members causes infinite recursion.
-- Without step 2-3: "permission denied for schema core_automation"
-- =============================================================================