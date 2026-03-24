-- Migration: 0050_move_agent_api_keys_to_public.sql
-- Purpose: Move agent_api_keys from core_hub to public schema and add service column
--           This table is used by multiple APIs (hub-api, automation-api), so public schema makes sense

-- Step 1: Add service column with default value before moving schema
ALTER TABLE core_hub.agent_api_keys 
ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'hub-api';

-- Add CHECK constraint for valid service values
ALTER TABLE core_hub.agent_api_keys 
ADD CONSTRAINT check_agent_api_keys_service 
CHECK (service IN ('hub-api', 'automation-api', 'intake-api'));

-- Step 2: Move table from core_hub back to public
ALTER TABLE core_hub.agent_api_keys SET SCHEMA public;

-- Step 3: Update RLS policy to reference correct schema (should auto-update, but verify)
DROP POLICY IF EXISTS "Service role can manage agent_api_keys" ON public.agent_api_keys;
CREATE POLICY "Service role can manage agent_api_keys" ON public.agent_api_keys 
FOR ALL TO "service_role" USING (true) WITH CHECK (true);
