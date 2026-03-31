-- Migration: 0057_namespace_resource_types.sql
-- Purpose: 
--   1. Drop the CHECK constraint on subscriptions.resource_type (eliminate maintenance burden)
--   2. Migrate existing resource_type values to namespaced format
--   3. Update sync triggers to use namespaced resource types
--
-- Naming convention:
--   Uvian Hub resources: uvian.conversation, uvian.space, uvian.ticket, uvian.job, uvian.intake, uvian.agent, uvian.submission
--   External platforms:  discord.channel

-- Step 1: Drop the CHECK constraint entirely
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_resource_type_check;

-- Step 2: Migrate existing data to namespaced types
UPDATE public.subscriptions SET resource_type = 'uvian.conversation' WHERE resource_type = 'conversation';
UPDATE public.subscriptions SET resource_type = 'uvian.space'      WHERE resource_type = 'space';
UPDATE public.subscriptions SET resource_type = 'uvian.ticket'     WHERE resource_type = 'ticket';
UPDATE public.subscriptions SET resource_type = 'uvian.job'        WHERE resource_type = 'job';
UPDATE public.subscriptions SET resource_type = 'uvian.intake'     WHERE resource_type = 'intake';
UPDATE public.subscriptions SET resource_type = 'uvian.agent'      WHERE resource_type = 'agent';
UPDATE public.subscriptions SET resource_type = 'uvian.submission' WHERE resource_type = 'submission';

-- Step 3: Update sync triggers to use namespaced resource types

CREATE OR REPLACE FUNCTION handle_conversation_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('conv_%s', NEW.conversation_id), NEW.user_id, 'uvian.conversation', NEW.conversation_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('conv_%s', OLD.conversation_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_space_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('space_%s', NEW.space_id), NEW.user_id, 'uvian.space', NEW.space_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM subscriptions
    WHERE id = format('space_%s', OLD.space_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
