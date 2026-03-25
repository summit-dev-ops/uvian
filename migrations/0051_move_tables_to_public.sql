-- Migration: 0051_move_tables_to_public.sql
-- Purpose: Move automaton_providers and subscriptions tables from core_hub to public schema
--          Also move the get_subscription_providers_for_resource view to public

-- Step 1: Drop the view in core_hub schema (it will be recreated in public)
DROP VIEW IF EXISTS core_hub.get_subscription_providers_for_resource;

-- Step 2: Move automaton_providers table from core_hub to public
ALTER TABLE core_hub.automaton_providers SET SCHEMA public;

-- Step 3: Move subscriptions table from core_hub to public
ALTER TABLE core_hub.subscriptions SET SCHEMA public;

-- Step 4: Update the check constraint on subscriptions.resource_type to support cross-domain resources
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_resource_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_resource_type_check 
  CHECK (resource_type IN ('conversation', 'space', 'ticket', 'job', 'agent', 'intake', 'submission'));

-- Step 5: Recreate the view in public schema (was previously in core_hub)
CREATE OR REPLACE VIEW public.get_subscription_providers_for_resource AS
SELECT 
  s.id AS subscription_id,
  s.user_id,
  s.resource_type,
  s.resource_id,
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
JOIN public.automaton_providers ap ON s.provider_id = ap.id
WHERE ap.is_active = true;

-- Step 6: Ensure RLS policies exist on moved tables
-- PostgreSQL handles schema change automatically - policies will continue to work
-- as they reference auth.uid() and account_members (both in public schema)
