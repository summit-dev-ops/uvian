-- Migration: 0055_add_is_active_to_subscriptions.sql
-- Purpose: Add is_active column to subscriptions to allow controlling which agents
--          receive events when multiple agents are subscribed to a resource
--
-- is_active: When true, events are routed to the agent(s) subscribed to this resource
--            When false, events for this subscription are suppressed

-- Step 1: Add is_active column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Update the get_subscription_providers_for_resource view to filter by is_active
DROP VIEW IF EXISTS public.get_subscription_providers_for_resource;

CREATE OR REPLACE VIEW public.get_subscription_providers_for_resource AS
SELECT 
  s.id AS subscription_id,
  s.user_id,
  s.resource_type,
  s.resource_id,
  s.is_active AS subscription_is_active,
  s.created_at AS subscription_created_at,
  ap.id AS provider_id,
  ap.name AS provider_name,
  ap.type,
  ap.url,
  ap.auth_method,
  ap.auth_config,
  ap.is_active AS provider_is_active,
  ap.created_at AS provider_created_at,
  s.user_id AS dependent_user_id
FROM public.subscriptions s
JOIN public.automaton_providers ap 
  ON ap.owner_user_id = s.user_id AND ap.is_active = true
JOIN public.user_automation_providers uap
  ON uap.automation_provider_id = ap.id
  AND uap.user_id = s.user_id
WHERE s.is_active = true;
