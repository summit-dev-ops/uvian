-- Migration: 0052_create_user_identities_and_user_automation_providers.sql
-- Purpose: Create user_identities and user_automation_providers tables
--          Drop old agent_configs table (replaced by user_automation_providers)
--          Tables: automaton_providers, subscriptions already in public from 0051

-- Step 1: Drop old agent_configs table
DROP TABLE IF EXISTS public.agent_configs;

-- Step 2: Create user_identities table for external ID mappings (WhatsApp, etc.)
CREATE TABLE public.user_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'whatsapp',
  provider_user_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Step 3: Add check constraint for valid provider values
ALTER TABLE public.user_identities 
  ADD CONSTRAINT check_user_identities_provider 
  CHECK (provider IN ('whatsapp', 'slack', 'telegram', 'discord', 'email'));

-- Step 4: Enable RLS
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy - users can manage their own identities
CREATE POLICY "Users can manage their own identities" ON public.user_identities
  FOR ALL USING (user_id = auth.uid());

-- Step 6: Create user_automation_providers join table
CREATE TABLE public.user_automation_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_provider_id UUID NOT NULL REFERENCES public.automaton_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, automation_provider_id)
);

-- Step 7: Enable RLS
ALTER TABLE public.user_automation_providers ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policy - users can manage their own provider links
CREATE POLICY "Users can manage their own automation provider links" ON public.user_automation_providers
  FOR ALL USING (user_id = auth.uid());

-- Step 9: Update the view to join with user_automation_providers
-- This ensures only users linked to a provider receive events for their subscriptions
DROP VIEW IF EXISTS public.get_subscription_providers_for_resource;
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
JOIN public.automaton_providers ap 
  ON s.provider_id = ap.id
JOIN public.user_automation_providers uap
  ON uap.automation_provider_id = ap.id
  AND uap.user_id = s.user_id
WHERE ap.is_active = true;
