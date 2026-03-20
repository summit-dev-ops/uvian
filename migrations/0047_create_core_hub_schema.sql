-- =============================================================================
-- PHASE 47: CORE HUB SCHEMA
-- Migration: 0047_create_core_hub_schema.sql
-- Purpose: Move hub-related tables and views into dedicated core_hub schema
--          accounts and account_members remain in public as top-level container
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE SCHEMA
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS core_hub;

-- =============================================================================
-- STEP 2: MOVE TABLES (dependency order: parents first, children last)
-- =============================================================================

-- Tier 1: Independent tables (no FKs from other hub tables)
ALTER TABLE public.settings SET SCHEMA core_hub;
ALTER TABLE public.profiles SET SCHEMA core_hub;

-- Tier 2: Tables that FK to public (accounts) or auth.users only
ALTER TABLE public.assets SET SCHEMA core_hub;
ALTER TABLE public.spaces SET SCHEMA core_hub;
ALTER TABLE public.conversations SET SCHEMA core_hub;
ALTER TABLE public.posts SET SCHEMA core_hub;

-- Tier 3: Tables that FK to hub tables above
ALTER TABLE public.space_members SET SCHEMA core_hub;
ALTER TABLE public.conversation_members SET SCHEMA core_hub;
ALTER TABLE public.messages SET SCHEMA core_hub;
ALTER TABLE public.notes SET SCHEMA core_hub;
ALTER TABLE public.post_contents SET SCHEMA core_hub;

-- Tier 4: Agent/automation tables
ALTER TABLE public.automaton_providers SET SCHEMA core_hub;
ALTER TABLE public.agent_api_keys SET SCHEMA core_hub;
ALTER TABLE public.agent_configs SET SCHEMA core_hub;

-- Tier 5: Subscription routing
ALTER TABLE public.subscriptions SET SCHEMA core_hub;

-- =============================================================================
-- STEP 3: UPDATE TRIGGER FUNCTION BODIES
-- All triggers stay on their original tables (auth.users, conversation_members,
-- space_members, accounts). Only the INSERT/SELECT targets change.
-- =============================================================================

-- handle_settings_creation: INSERT INTO settings
CREATE OR REPLACE FUNCTION public.handle_settings_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO core_hub.settings (user_id, settings)
  VALUES (NEW.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_profile_creation: INSERT INTO profiles
CREATE OR REPLACE FUNCTION public.handle_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO core_hub.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_conversation_member_sync: INSERT/DELETE from subscriptions
CREATE OR REPLACE FUNCTION public.handle_conversation_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core_hub.subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('conv_%s', NEW.conversation_id), NEW.user_id, 'conversation', NEW.conversation_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM core_hub.subscriptions
    WHERE id = format('conv_%s', OLD.conversation_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- handle_space_member_sync: INSERT/DELETE from subscriptions
CREATE OR REPLACE FUNCTION public.handle_space_member_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core_hub.subscriptions (id, user_id, resource_type, resource_id)
    VALUES (format('space_%s', NEW.space_id), NEW.user_id, 'space', NEW.space_id)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM core_hub.subscriptions
    WHERE id = format('space_%s', OLD.space_id) AND user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create_internal_provider_for_account: INSERT into automaton_providers
CREATE OR REPLACE FUNCTION public.create_internal_provider_for_account()
RETURNS TRIGGER AS $$
DECLARE
    owner_user_id UUID;
BEGIN
    SELECT user_id INTO owner_user_id
    FROM public.account_members
    WHERE account_id = NEW.id AND role->>'name' = 'owner'
    LIMIT 1;

    IF FOUND THEN
        INSERT INTO core_hub.automaton_providers (account_id, owner_user_id, name, type, url, auth_method)
        VALUES (NEW.id, owner_user_id, 'Internal Provider', 'internal', NULL, 'none');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- get_account_id_for_user: SELECT from account_members (stays in public)
CREATE OR REPLACE FUNCTION public.get_account_id_for_user(target_user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT account_id
    FROM public.account_members
    WHERE user_id = target_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: DROP OLD PUBLIC VIEWS
-- All views that query moved tables are dropped and recreated in core_hub
-- =============================================================================

DROP VIEW IF EXISTS public.get_conversations_for_current_user;
DROP VIEW IF EXISTS public.get_conversation_members;
DROP VIEW IF EXISTS public.get_conversation_messages;
DROP VIEW IF EXISTS public.get_conversation_details;
DROP VIEW IF EXISTS public.get_conversations_for_space;
DROP VIEW IF EXISTS public.get_spaces_for_current_user;
DROP VIEW IF EXISTS public.get_space_members;
DROP VIEW IF EXISTS public.get_space_details;
DROP VIEW IF EXISTS public.get_public_spaces;
DROP VIEW IF EXISTS public.get_my_profile;
DROP VIEW IF EXISTS public.get_my_settings;
DROP VIEW IF EXISTS public.get_my_assets;
DROP VIEW IF EXISTS public.get_asset_details;
DROP VIEW IF EXISTS public.get_posts_for_space;
DROP VIEW IF EXISTS public.get_post_details;
DROP VIEW IF EXISTS public.get_subscription_providers_for_resource;
DROP VIEW IF EXISTS public.get_my_agent_configs;

-- =============================================================================
-- STEP 5: RECREATE ALL VIEWS IN CORE_HUB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VIEW: get_my_profile
-- Returns current user's profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_my_profile AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = p.user_id),
    ''
  ) as email
FROM core_hub.profiles p
WHERE p.user_id = auth.uid();

-- -----------------------------------------------------------------------------
-- VIEW: get_my_settings
-- Returns current user's settings
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_my_settings AS
SELECT
  s.user_id,
  s.settings,
  s.created_at,
  s.updated_at
FROM core_hub.settings s
WHERE s.user_id = auth.uid();

-- -----------------------------------------------------------------------------
-- VIEW: get_my_assets
-- Returns assets for current user's account
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_my_assets AS
SELECT
  a.id,
  a.account_id,
  a.uploader_user_id,
  a.type,
  a.url,
  a.filename,
  a.mime_type,
  a.file_size_bytes,
  a.storage_type,
  a.metadata,
  a.created_at,
  a.updated_at,
  p.display_name as uploader_name,
  p.avatar_url as uploader_avatar
FROM core_hub.assets a
LEFT JOIN core_hub.profiles p ON a.uploader_user_id = p.user_id
WHERE a.account_id IN (
  SELECT am.account_id FROM public.account_members am WHERE am.user_id = auth.uid()
)
ORDER BY a.created_at DESC;

-- -----------------------------------------------------------------------------
-- VIEW: get_asset_details
-- Returns single asset with full details
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_asset_details AS
SELECT
  a.id,
  a.account_id,
  a.uploader_user_id,
  a.type,
  a.url,
  a.filename,
  a.mime_type,
  a.file_size_bytes,
  a.storage_type,
  a.metadata,
  a.created_at,
  a.updated_at,
  p.display_name as uploader_name,
  p.avatar_url as uploader_avatar,
  acc.name as account_name
FROM core_hub.assets a
LEFT JOIN core_hub.profiles p ON a.uploader_user_id = p.user_id
LEFT JOIN public.accounts acc ON a.account_id = acc.id
WHERE a.account_id IN (
  SELECT am.account_id FROM public.account_members am WHERE am.user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_spaces_for_current_user
-- Returns spaces the current user is a member of
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_spaces_for_current_user AS
SELECT
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  s.cover_image_url,
  s.main_image_url,
  sm.role as user_role,
  (
    SELECT COUNT(*)::int
    FROM core_hub.space_members sm2
    WHERE sm2.space_id = s.id
  ) as member_count,
  (
    SELECT COUNT(*)::int
    FROM core_hub.conversations c
    WHERE c.space_id = s.id
  ) as conversation_count
FROM core_hub.spaces s
INNER JOIN core_hub.space_members sm ON s.id = sm.space_id
WHERE sm.user_id = auth.uid()
ORDER BY s.updated_at DESC;

-- -----------------------------------------------------------------------------
-- VIEW: get_space_members
-- Returns members of a space (filter by space_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_space_members AS
SELECT
  sm.id,
  sm.space_id,
  sm.user_id,
  sm.role,
  sm.joined_at,
  p.display_name,
  p.avatar_url,
  p.bio,
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = sm.user_id),
    ''
  ) as email
FROM core_hub.space_members sm
INNER JOIN core_hub.profiles p ON sm.user_id = p.user_id
WHERE sm.space_id IN (
  SELECT space_id
  FROM core_hub.space_members
  WHERE user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_space_details
-- Returns single space with full details (filter by space_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_space_details AS
SELECT
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  s.cover_image_url,
  s.main_image_url,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int
    FROM core_hub.space_members sm2
    WHERE sm2.space_id = s.id
  ) as member_count,
  (
    SELECT COUNT(*)::int
    FROM core_hub.conversations c
    WHERE c.space_id = s.id
  ) as conversation_count,
  (
    SELECT sm.role::text
    FROM core_hub.space_members sm
    WHERE sm.space_id = s.id AND sm.user_id = auth.uid()
  ) as user_role
FROM core_hub.spaces s
LEFT JOIN core_hub.profiles cp ON s.created_by = cp.user_id
WHERE s.id IN (
  SELECT space_id
  FROM core_hub.space_members
  WHERE user_id = auth.uid()
  UNION
  SELECT id FROM core_hub.spaces WHERE is_private = false
);

-- -----------------------------------------------------------------------------
-- VIEW: get_public_spaces
-- Returns all public spaces (for discovery)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_public_spaces AS
SELECT
  s.id,
  s.name,
  s.description,
  s.avatar_url,
  s.created_by,
  s.settings,
  s.is_private,
  s.created_at,
  s.updated_at,
  s.cover_url,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int
    FROM core_hub.space_members sm2
    WHERE sm2.space_id = s.id
  ) as member_count,
  (
    SELECT COUNT(*)::int
    FROM core_hub.conversations c
    WHERE c.space_id = s.id
  ) as conversation_count
FROM core_hub.spaces s
LEFT JOIN core_hub.profiles cp ON s.created_by = cp.user_id
WHERE s.is_private = false
ORDER BY s.updated_at DESC;

-- -----------------------------------------------------------------------------
-- VIEW: get_conversations_for_current_user
-- Returns conversations the current user is a member of
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_conversations_for_current_user AS
SELECT
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  cm.role as user_role,
  (
    SELECT COUNT(*)::int
    FROM core_hub.messages m
    WHERE m.conversation_id = c.id
  ) as message_count,
  (
    SELECT m.content
    FROM core_hub.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message,
  0 as unread_count,
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM core_hub.conversations c
INNER JOIN core_hub.conversation_members cm ON c.id = cm.conversation_id
LEFT JOIN core_hub.spaces s ON c.space_id = s.id
WHERE cm.user_id = auth.uid()
ORDER BY c.updated_at DESC;

-- -----------------------------------------------------------------------------
-- VIEW: get_conversation_members
-- Returns members of a conversation (filter by conversation_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_conversation_members AS
SELECT
  cm.id,
  cm.conversation_id,
  cm.user_id,
  cm.role,
  cm.joined_at,
  p.display_name,
  p.avatar_url,
  p.bio,
  COALESCE(
    (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = cm.user_id),
    ''
  ) as email
FROM core_hub.conversation_members cm
INNER JOIN core_hub.profiles p ON cm.user_id = p.user_id
WHERE cm.conversation_id IN (
  SELECT conversation_id
  FROM core_hub.conversation_members
  WHERE user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_conversation_messages
-- Returns messages in a conversation (filter by conversation_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_conversation_messages AS
SELECT
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.role,
  m.metadata,
  m.created_at,
  m.updated_at,
  p.display_name as sender_display_name,
  p.avatar_url as sender_avatar_url
FROM core_hub.messages m
LEFT JOIN core_hub.profiles p ON m.sender_id = p.user_id
WHERE m.conversation_id IN (
  SELECT conversation_id
  FROM core_hub.conversation_members
  WHERE user_id = auth.uid()
)
ORDER BY m.created_at ASC;

-- -----------------------------------------------------------------------------
-- VIEW: get_conversation_details
-- Returns single conversation with full details (filter by conversation_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_conversation_details AS
SELECT
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int
    FROM core_hub.messages m2
    WHERE m2.conversation_id = c.id
  ) as message_count,
  (
    SELECT COUNT(*)::int
    FROM core_hub.conversation_members cm2
    WHERE cm2.conversation_id = c.id
  ) as member_count,
  (
    SELECT cm.role::text
    FROM core_hub.conversation_members cm
    WHERE cm.conversation_id = c.id AND cm.user_id = auth.uid()
  ) as user_role,
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM core_hub.conversations c
LEFT JOIN core_hub.profiles cp ON c.created_by = cp.user_id
LEFT JOIN core_hub.spaces s ON c.space_id = s.id
WHERE c.id IN (
  SELECT conversation_id
  FROM core_hub.conversation_members
  WHERE user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_conversations_for_space
-- Returns all conversations in a space (filter by space_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_conversations_for_space AS
SELECT
  c.id,
  c.title,
  c.space_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  cp.display_name as creator_display_name,
  cp.avatar_url as creator_avatar_url,
  (
    SELECT COUNT(*)::int
    FROM core_hub.messages m2
    WHERE m2.conversation_id = c.id
  ) as message_count,
  (
    SELECT COUNT(*)::int
    FROM core_hub.conversation_members cm2
    WHERE cm2.conversation_id = c.id
  ) as member_count
FROM core_hub.conversations c
LEFT JOIN core_hub.profiles cp ON c.created_by = cp.user_id
WHERE c.space_id IN (
  SELECT space_id
  FROM core_hub.space_members
  WHERE user_id = auth.uid()
)
ORDER BY c.updated_at DESC;

-- -----------------------------------------------------------------------------
-- VIEW: get_posts_for_space
-- Returns posts for a specific space (filter by space_id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_posts_for_space AS
SELECT
  p.id,
  p.space_id,
  p.author_id,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url
FROM core_hub.posts p
LEFT JOIN core_hub.profiles pr ON p.author_id = pr.user_id
WHERE p.space_id IN (
  SELECT space_id FROM core_hub.space_members WHERE user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_post_details
-- Returns single post with full details (filter by id in query)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_post_details AS
SELECT
  p.id,
  p.space_id,
  p.author_id,
  p.created_at,
  p.updated_at,
  pr.display_name as author_display_name,
  pr.avatar_url as author_avatar_url,
  pr.bio as author_bio,
  s.name as space_name,
  s.avatar_url as space_avatar_url
FROM core_hub.posts p
LEFT JOIN core_hub.profiles pr ON p.author_id = pr.user_id
LEFT JOIN core_hub.spaces s ON p.space_id = s.id
WHERE p.space_id IN (
  SELECT space_id FROM core_hub.space_members WHERE user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- VIEW: get_subscription_providers_for_resource
-- Returns automation providers for a given resource (conversation/space)
-- Used by event worker to route events to subscribed providers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_subscription_providers_for_resource AS
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
FROM core_hub.subscriptions s
JOIN core_hub.agent_configs ac
  ON ac.agent_user_id = s.user_id
  AND ac.is_active = true
JOIN core_hub.automaton_providers ap
  ON ac.automation_provider_id = ap.id
  AND ap.is_active = true;

-- -----------------------------------------------------------------------------
-- VIEW: get_my_agent_configs
-- Returns agent configs for the current user's accounts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW core_hub.get_my_agent_configs AS
SELECT
    ac.*,
    p.display_name as agent_display_name,
    p.avatar_url as agent_avatar_url
FROM core_hub.agent_configs ac
JOIN public.account_members am ON ac.account_id = am.account_id
LEFT JOIN core_hub.profiles p ON ac.agent_user_id = p.user_id
WHERE am.user_id = auth.uid();

-- -----------------------------------------------------------------------------
-- VIEW: get_my_account
-- Returns current user's account (remains in public - references public tables)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.get_my_account AS
SELECT
  a.id,
  a.name,
  a.settings,
  a.created_at,
  a.updated_at,
  am.role as user_role
FROM public.accounts a
INNER JOIN public.account_members am ON a.id = am.account_id
WHERE am.user_id = auth.uid();

-- -----------------------------------------------------------------------------
-- VIEW: get_account_members
-- Returns all members of current user's account (remains in public)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.get_account_members AS
SELECT
  am.id,
  am.account_id,
  am.user_id,
  am.role,
  am.created_at,
  p.display_name,
  p.avatar_url
FROM public.account_members am
INNER JOIN public.accounts a ON am.account_id = a.id
LEFT JOIN core_hub.profiles p ON am.user_id = p.user_id
WHERE a.id IN (
  SELECT account_id
  FROM public.account_members
  WHERE user_id = auth.uid()
);
