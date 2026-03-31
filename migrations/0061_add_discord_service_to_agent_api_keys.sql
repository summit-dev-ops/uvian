-- Migration: 0061_add_discord_service_to_agent_api_keys.sql
-- Purpose: Add 'discord' as a valid service scope for agent API keys

ALTER TABLE public.agent_api_keys 
  DROP CONSTRAINT IF EXISTS check_agent_api_keys_service;

ALTER TABLE public.agent_api_keys 
  ADD CONSTRAINT check_agent_api_keys_service 
  CHECK (service IN ('hub-api', 'automation-api', 'intake-api', 'discord'));
