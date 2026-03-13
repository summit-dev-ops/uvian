-- Migration: 0029_create_agent_system.sql
-- Creates automaton_providers and agent_configs tables for the agent creation system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create automaton_providers table
CREATE TABLE IF NOT EXISTS automaton_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('internal', 'webhook')) DEFAULT 'internal',
    url TEXT,
    auth_method TEXT CHECK (auth_method IN ('none', 'bearer', 'api_key')) DEFAULT 'none',
    auth_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent_configs table
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    automation_provider_id UUID NOT NULL REFERENCES automaton_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subscribed_events JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automaton_providers_account_id ON automaton_providers(account_id);
CREATE INDEX IF NOT EXISTS idx_automaton_providers_account_active ON automaton_providers(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_agent_configs_account_id ON agent_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_account_active ON agent_configs(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_user_id ON agent_configs(agent_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_automaton_providers_updated_at
    BEFORE UPDATE ON automaton_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at
    BEFORE UPDATE ON agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create internal provider for new accounts
CREATE OR REPLACE FUNCTION create_internal_provider_for_account()
RETURNS TRIGGER AS $$
DECLARE
    owner_user_id UUID;
BEGIN
    -- Get the owner of the account from account_members
    SELECT user_id INTO owner_user_id
    FROM account_members
    WHERE account_id = NEW.id AND role->>'name' = 'owner'
    LIMIT 1;

    IF FOUND THEN
        INSERT INTO automaton_providers (account_id, owner_user_id, name, type, url, auth_method)
        VALUES (NEW.id, owner_user_id, 'Internal Provider', 'internal', NULL, 'none');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create internal provider when account is created
CREATE TRIGGER trigger_create_internal_provider
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_internal_provider_for_account();

-- RLS Policies for automaton_providers
ALTER TABLE automaton_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view providers in their accounts"
    ON automaton_providers FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert providers in their accounts"
    ON automaton_providers FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can update providers in their accounts"
    ON automaton_providers FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can delete providers in their accounts"
    ON automaton_providers FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

-- RLS Policies for agent_configs
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents in their accounts"
    ON agent_configs FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert agents in their accounts"
    ON agent_configs FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can update agents in their accounts"
    ON agent_configs FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can delete agents in their accounts"
    ON agent_configs FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members 
            WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')
        )
    );

-- Create views for API
CREATE OR REPLACE VIEW get_my_automaton_providers AS
SELECT 
    ap.*
FROM automaton_providers ap
JOIN account_members am ON ap.account_id = am.account_id
WHERE am.user_id = auth.uid();

CREATE OR REPLACE VIEW get_my_agent_configs AS
SELECT 
    ac.*,
    p.display_name as agent_display_name,
    p.avatar_url as agent_avatar_url
FROM agent_configs ac
JOIN account_members am ON ac.account_id = am.account_id
LEFT JOIN profiles p ON ac.agent_user_id = p.user_id
WHERE am.user_id = auth.uid();
