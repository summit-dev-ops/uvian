-- Migration: 0053_remove_agent_configs_add_user_automation_providers.sql
-- Purpose: Remove agent_configs table, create user_automation_providers join table
--          Simplifies the model: user → user_automation_providers → automation_providers

-- Step 1: Drop the agent_configs table
DROP TABLE IF EXISTS public.agent_configs;

-- Step 2: Create user_automation_providers join table
CREATE TABLE public.user_automation_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_provider_id UUID NOT NULL REFERENCES public.automaton_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, automation_provider_id)
);

-- Step 3: Enable RLS
ALTER TABLE public.user_automation_providers ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy - users can manage their own provider links
CREATE POLICY "Users can manage their own automation provider links" ON public.user_automation_providers
  FOR ALL USING (user_id = auth.uid());
