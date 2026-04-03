-- Migration: 0066_add_scheduler_service_to_agent_api_keys.sql
-- Purpose: Add 'uvian-scheduler' as a valid service scope for agent API keys

ALTER TABLE public.agent_api_keys 
  DROP CONSTRAINT IF EXISTS check_agent_api_keys_service;

ALTER TABLE public.agent_api_keys 
  ADD CONSTRAINT check_agent_api_keys_service 
  CHECK (service IN ('hub-api', 'automation-api', 'intake-api', 'discord', 'uvian-scheduler'));
