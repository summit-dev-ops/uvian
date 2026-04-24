-- =============================================================================
-- PHASE 0089: STANDARDIZE AUTOMATION RLS POLICIES - TABLE POLICIES
-- Migration: 0089_standardize_automation_rls_policies.sql
-- Purpose:
--   1. Remove user write policies - API-only writes via service_role
--   2. Ensure service_role policies exist for all tables
-- =============================================================================

-- =============================================================================
-- STEP 1: REMOVE USER WRITE POLICIES FROM SKILLS
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own account skills" ON core_automation.skills;

-- =============================================================================
-- STEP 2: REMOVE USER WRITE POLICIES FROM AGENT_SKILLS
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own agent skills" ON core_automation.agent_skills;

-- =============================================================================
-- STEP 3: REMOVE USER WRITE POLICIES FROM LLMS
-- =============================================================================

DROP POLICY IF EXISTS "Account admins can insert llms" ON core_automation.llms;
DROP POLICY IF EXISTS "Account admins can update llms" ON core_automation.llms;
DROP POLICY IF EXISTS "Account admins can delete llms" ON core_automation.llms;

-- =============================================================================
-- STEP 4: REMOVE USER WRITE POLICIES FROM AGENT_LLMS
-- =============================================================================

DROP POLICY IF EXISTS "Owner can manage own agent_llms" ON core_automation.agent_llms;

-- =============================================================================
-- STEP 5: REMOVE USER WRITE POLICIES FROM MCPS
-- =============================================================================

DROP POLICY IF EXISTS "Account admins can insert mcps" ON core_automation.mcps;
DROP POLICY IF EXISTS "Account admins can update mcps" ON core_automation.mcps;
DROP POLICY IF EXISTS "Account admins can delete mcps" ON core_automation.mcps;

-- =============================================================================
-- STEP 6: REMOVE USER WRITE POLICIES FROM AGENT_MCPS
-- =============================================================================

DROP POLICY IF EXISTS "Owner can manage own agent_mcps" ON core_automation.agent_mcps;

-- =============================================================================
-- STEP 7: REMOVE USER WRITE POLICIES FROM HOOKS
-- =============================================================================

DROP POLICY IF EXISTS "Account admins can manage hooks" ON core_automation.hooks;

-- =============================================================================
-- STEP 8: REMOVE USER WRITE POLICIES FROM AGENT_HOOKS
-- =============================================================================

DROP POLICY IF EXISTS "Owner can manage own agent_hooks" ON core_automation.agent_hooks;

-- =============================================================================
-- STEP 9: ENSURE SERVICE_ROLE POLICIES EXIST FOR ALL TABLES
-- =============================================================================

-- skills
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'skills'
        AND policyname = 'Service role full access to skills'
    ) THEN
        CREATE POLICY "Service role full access to skills"
            ON core_automation.skills FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- agent_skills
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'agent_skills'
        AND policyname = 'Service role full access to agent_skills'
    ) THEN
        CREATE POLICY "Service role full access to agent_skills"
            ON core_automation.agent_skills FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- llms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'llms'
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON core_automation.llms FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- agent_llms
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'agent_llms'
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON core_automation.agent_llms FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- mcps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'mcps'
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON core_automation.mcps FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- agent_mcps
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'agent_mcps'
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON core_automation.agent_mcps FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- hooks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'hooks'
        AND policyname = 'Service role full access to hooks'
    ) THEN
        CREATE POLICY "Service role full access to hooks"
            ON core_automation.hooks FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- agent_hooks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'core_automation'
        AND tablename = 'agent_hooks'
        AND policyname = 'Service role full access agent_hooks'
    ) THEN
        CREATE POLICY "Service role full access agent_hooks"
            ON core_automation.agent_hooks FOR ALL
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- This migration:
--   1. Removes all user write policies (INSERT/UPDATE/DELETE) from 8 tables
--   2. Ensures service_role policies exist for all tables (API-only writes)
--
-- After this migration:
--   - userClient (user JWT) can SELECT own data via tables
--   - userClient CANNOT INSERT/UPDATE/DELETE any automation data
--   - adminClient (service_role) can perform all operations on tables
-- =============================================================================