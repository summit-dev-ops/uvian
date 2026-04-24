-- =============================================================================
-- PHASE 0090: ADD AUTHENTICATED GRANTS ON HOOKS TABLES
-- Migration: 0090_add_grants_hooks_tables.sql
-- Purpose:
--   Grant SELECT on hooks tables to authenticated role for Data API access
--   The core_automation schema needs authenticated users to access base tables
--   that views join against.
-- =============================================================================

-- =============================================================================
-- STEP 1: GRANT SELECT ON HOOKS TABLES TO AUTHENTICATED
-- These tables are used by views (v_agent_hooks_for_worker, v_agent_hooks_with_config)
-- Without these grants, PostgREST cannot access the underlying tables
-- =============================================================================

GRANT SELECT ON core_automation.hooks TO authenticated;
GRANT SELECT ON core_automation.agent_hooks TO authenticated;
GRANT SELECT ON core_automation.hook_effects TO authenticated;

-- =============================================================================
-- STEP 2: VERIFY GRANTS APPLIED
-- =============================================================================

DO $$
DECLARE
    v_missing_grant BOOLEAN := false;
BEGIN
    -- Check hooks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_schema = 'core_automation'
        AND table_name = 'hooks'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) THEN
        RAISE WARNING 'Missing GRANT SELECT ON core_automation.hooks TO authenticated';
        v_missing_grant := true;
    END IF;

    -- Check agent_hooks
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_schema = 'core_automation'
        AND table_name = 'agent_hooks'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) THEN
        RAISE WARNING 'Missing GRANT SELECT ON core_automation.agent_hooks TO authenticated';
        v_missing_grant := true;
    END IF;

    -- Check hook_effects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_schema = 'core_automation'
        AND table_name = 'hook_effects'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) THEN
        RAISE WARNING 'Missing GRANT SELECT ON core_automation.hook_effects TO authenticated';
        v_missing_grant := true;
    END IF;

    IF v_missing_grant THEN
        RAISE EXCEPTION 'One or more grants failed to apply';
    END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- This migration adds SELECT grants to the authenticated role on hooks tables.
-- This is required for PostgREST (Supabase Data API) to access the underlying
-- tables that views like v_agent_hooks_for_worker join against.
--
-- Without these grants, authenticated users get "permission denied" when
-- the Data API tries to query views that reference these tables.
-- =============================================================================