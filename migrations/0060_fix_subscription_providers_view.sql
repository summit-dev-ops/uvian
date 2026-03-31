-- Migration: 0060_fix_subscription_providers_view.sql
-- Purpose: Remove redundant owner_user_id constraint from the subscription providers view
-- The user_automation_providers join table already establishes the link, so checking
-- owner_user_id is unnecessary and blocks valid providers.

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
  uap.user_id AS dependent_user_id
FROM public.subscriptions s
JOIN public.user_automation_providers uap ON uap.user_id = s.user_id
JOIN public.automaton_providers ap 
  ON ap.id = uap.automation_provider_id AND ap.is_active = true
WHERE s.is_active = true;
