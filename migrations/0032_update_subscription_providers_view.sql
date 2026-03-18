-- =============================================================================
-- PHASE 32: SUBSCRIPTION PROVIDERS VIEW UPDATE
-- Migration: 0032_update_subscription_providers_view.sql
-- Purpose: Update view to join on agent_configs dependents instead of provider owner
-- =============================================================================

-- =============================================================================
-- VIEW: get_subscription_providers_for_resource
-- Returns automation providers for a given resource (conversation/space)
-- Now joins via agent_configs (dependents) instead of automaton_providers.owner_user_id
-- =============================================================================

CREATE OR REPLACE VIEW public.get_subscription_providers_for_resource AS
SELECT
  s.id AS subscription_id,
  s.user_id,
  s.resource_type,
  s.resource_id,
  ac.agent_user_id AS dependent_user_id,
  ap.id AS provider_id,
  ap.name AS provider_name,
  ap.type,
  ap.url,
  ap.auth_method,
  ap.auth_config
FROM subscriptions s
JOIN agent_configs ac
  ON ac.agent_user_id = s.user_id
  AND ac.is_active = true
JOIN automaton_providers ap
  ON ac.automation_provider_id = ap.id
  AND ap.is_active = true;
