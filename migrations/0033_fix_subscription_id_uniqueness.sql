-- =============================================================================
-- PHASE 33: FIX SUBSCRIPTION ID UNIQUENESS
-- Migration: 0033_fix_subscription_id_uniqueness.sql
-- Purpose: Fix subscription IDs to be unique per user, not just per resource
-- This allows agents and humans to both subscribe to the same resource
-- =============================================================================

-- =============================================================================
-- Update trigger function for conversation members
-- Old ID: conv_{conversation_id} (causes conflicts when multiple users join)
-- New ID: conv_{user_id}_{conversation_id} (unique per user)
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_conversation_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('conv_%s_%s', NEW.user_id, NEW.conversation_id), NEW.user_id, 'conversation', NEW.conversation_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('conv_%s_%s', OLD.user_id, OLD.conversation_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Update trigger function for space members
-- Old ID: space_{space_id} (causes conflicts when multiple users join)
-- New ID: space_{user_id}_{space_id} (unique per user)
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_space_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('space_%s_%s', NEW.user_id, NEW.space_id), NEW.user_id, 'space', NEW.space_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('space_%s_%s', OLD.user_id, OLD.space_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Backfill existing subscriptions with user-specific IDs
-- Delete old format subscriptions and recreate with new format
-- =============================================================================

-- First, delete all existing subscriptions (they're derived from membership anyway)
DELETE FROM subscriptions;

-- Recreate from conversation_members
INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
SELECT format('conv_%s_%s', user_id, conversation_id), user_id, 'conversation', conversation_id
FROM conversation_members
ON CONFLICT DO NOTHING;

-- Recreate from space_members
INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
SELECT format('space_%s_%s', user_id, space_id), user_id, 'space', space_id
FROM space_members
ON CONFLICT DO NOTHING;
