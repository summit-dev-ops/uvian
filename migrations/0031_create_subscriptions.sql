-- =============================================================================
-- PHASE 31: SUBSCRIPTIONS
-- Migration: 0031_create_subscriptions.sql
-- Purpose: Subscription system for routing events to automation providers
-- =============================================================================

-- =============================================================================
-- TABLE: subscriptions
-- Stores user subscriptions to resources (conversations, spaces)
-- ID is derived: 'conv_{uuid}' or 'space_{uuid}' for fast lookups
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('conversation', 'space')),
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_resource ON subscriptions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- =============================================================================
-- RLS: subscriptions
-- =============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;
CREATE POLICY "Users can delete their own subscriptions" ON subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================================
-- FUNCTION: handle_conversation_member_sync
-- Automatically creates/deletes subscription when user joins/leaves conversation
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_conversation_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('conv_%s', NEW.conversation_id), NEW.user_id, 'conversation', NEW.conversation_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('conv_%s', OLD.conversation_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversation_member_subscription_sync ON conversation_members;
CREATE TRIGGER conversation_member_subscription_sync
  AFTER INSERT OR DELETE ON conversation_members
  FOR EACH ROW EXECUTE FUNCTION handle_conversation_member_sync();

-- =============================================================================
-- FUNCTION: handle_space_member_sync
-- Automatically creates/deletes subscription when user joins/leaves space
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_space_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('space_%s', NEW.space_id), NEW.user_id, 'space', NEW.space_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('space_%s', OLD.space_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS space_member_subscription_sync ON space_members;
CREATE TRIGGER space_member_subscription_sync
  AFTER INSERT OR DELETE ON space_members
  FOR EACH ROW EXECUTE FUNCTION handle_space_member_sync();

-- =============================================================================
-- VIEW: get_subscription_providers_for_resource
-- Returns automation providers for a given resource (conversation/space)
-- Used by event worker to route events to subscribed providers
-- =============================================================================

CREATE OR REPLACE VIEW public.get_subscription_providers_for_resource AS
SELECT
  s.id AS subscription_id,
  s.user_id,
  s.resource_type,
  s.resource_id,
  ap.id AS provider_id,
  ap.name AS provider_name,
  ap.type,
  ap.url,
  ap.auth_method,
  ap.auth_config
FROM subscriptions s
JOIN automaton_providers ap
  ON ap.owner_user_id = s.user_id
  AND ap.is_active = true;

-- =============================================================================
-- SEED: Initialize subscriptions from existing memberships
-- =============================================================================

INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
SELECT format('conv_%s', conversation_id), user_id, 'conversation', conversation_id
FROM conversation_members
ON CONFLICT DO NOTHING;

INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
SELECT format('space_%s', space_id), user_id, 'space', space_id
FROM space_members
ON CONFLICT DO NOTHING;
