-- Migration: 0059_alter_subscriptions_resource_id_to_text.sql
-- Purpose: Change resource_id from UUID to TEXT to support external platform IDs
-- (e.g. Discord snowflake channel IDs like 1446219134072389850)

-- Step 1: Drop the view that depends on resource_id
DROP VIEW IF EXISTS public.get_subscription_providers_for_resource;

-- Step 2: Alter the column type
ALTER TABLE public.subscriptions 
  ALTER COLUMN resource_id TYPE TEXT USING resource_id::TEXT;

-- Step 3: Recreate the view
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
