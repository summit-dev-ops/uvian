-- =============================================================================
-- PHASE 16: RLS CLEANUP
-- Migration: 0016_rls_cleanup.sql
-- Purpose: Simplify RLS - keep SELECT, remove INSERT/UPDATE/DELETE (admin client handles writes),
--          fix infinite recursion on conversation_members and space_members
-- =============================================================================

-- STEP 1: Drop all INSERT policies (admin client handles writes)
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_members;
DROP POLICY IF EXISTS "Members can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Members can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can create spaces" ON spaces;
DROP POLICY IF EXISTS "Users can join spaces" ON space_members;
DROP POLICY IF EXISTS "Space members can create posts" ON posts;
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create feed items" ON feed_items;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own settings" ON settings;
DROP POLICY IF EXISTS "Users can create threads" ON process_threads;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;

-- STEP 2: Drop all UPDATE policies (admin client handles writes)
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Members can update conversations" ON conversations;
DROP POLICY IF EXISTS "Message senders can update their messages" ON messages;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own settings" ON settings;
DROP POLICY IF EXISTS "Space admins can update" ON spaces;
DROP POLICY IF EXISTS "Users can update their threads" ON process_threads;

-- STEP 3: Drop all DELETE policies (admin client handles writes)
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_members;
DROP POLICY IF EXISTS "Conversation admins can delete" ON conversations;
DROP POLICY IF EXISTS "Message senders can delete their messages" ON messages;
DROP POLICY IF EXISTS "Members can leave spaces" ON space_members;
DROP POLICY IF EXISTS "Space owners or admins can delete" ON spaces;
DROP POLICY IF EXISTS "Space admins can remove members" ON space_members;

-- STEP 4: Fix SELECT policies to avoid recursion

-- conversation_members: Simple policy - user sees their own membership
-- (Replaces complex self-referential policy that caused infinite recursion)
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
CREATE POLICY "Users can view their own membership"
  ON conversation_members FOR SELECT
  USING (user_id = auth.uid());

-- space_members: Simple policy - user sees their own membership
-- (Replaces complex self-referential policy that caused infinite recursion)
DROP POLICY IF EXISTS "Users can view space members" ON space_members;
CREATE POLICY "Users can view their own membership"
  ON space_members FOR SELECT
  USING (user_id = auth.uid());
