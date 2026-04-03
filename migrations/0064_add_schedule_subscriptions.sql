-- =============================================================================
-- PHASE 64: SCHEDULE SUBSCRIPTION SUPPORT
-- Migration: 0064_add_schedule_subscriptions.sql
-- Purpose:
--   1. Recreate the get_subscription_providers_for_resource view to support
--      'uvian.schedule' as a resource type alongside existing types
--   2. No structural changes needed — the subscriptions table already supports
--      arbitrary resource_type values (constraint was removed in migration 0057)
-- =============================================================================

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

-- Note: The view already supports any resource_type since the CHECK constraint
-- was removed in migration 0057. Schedules will use 'uvian.schedule' as their
-- resource_type when creating subscriptions.
