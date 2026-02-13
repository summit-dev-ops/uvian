-- 1. Create a schema for auth helpers if you want to keep it clean, 
-- or just put it in public. We'll use public for simplicity here.
CREATE OR REPLACE FUNCTION get_my_profile_ids()
RETURNS TABLE (id UUID) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns all profile IDs linked to the currently logged-in user
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$;

-- Drop existing policies on Spaces
DROP POLICY IF EXISTS "Users can view spaces they are members of" ON spaces;
DROP POLICY IF EXISTS "Users can create spaces" ON spaces;
DROP POLICY IF EXISTS "Space owners can update spaces" ON spaces;
DROP POLICY IF EXISTS "Space owners can delete spaces" ON spaces;

-- Drop existing policies on Space Members
DROP POLICY IF EXISTS "Users can view space members" ON space_members;
DROP POLICY IF EXISTS "Space admins can invite members" ON space_members;
DROP POLICY IF EXISTS "Space admins can update member roles" ON space_members;
DROP POLICY IF EXISTS "Space admins and self can remove members" ON space_members;

-- 2. SPACES: Read-only RLS
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spaces are visible to members or if public" ON spaces
FOR SELECT USING (
  is_private = FALSE OR 
  id IN (SELECT space_id FROM space_members WHERE profile_id IN (SELECT get_my_profile_ids()))
);

-- 3. SPACE_MEMBERS: Read-only RLS
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members are visible to other members" ON space_members
FOR SELECT USING (
  space_id IN (
    SELECT id FROM spaces WHERE is_private = FALSE OR 
    id IN (SELECT space_id FROM space_members WHERE profile_id IN (SELECT get_my_profile_ids()))
  )
);


-- 2. Clean up existing Chat policies
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in spaces" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they are members of" ON conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON messages;

DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
DROP POLICY IF EXISTS "Admins can invite members" ON conversation_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON conversation_members;
DROP POLICY IF EXISTS "Admins and self can remove members" ON conversation_members;

-- 3. High-Performance SELECT Policies (RLS)

-- CONVERSATIONS: Visible if you are a direct member OR if it belongs to a Space you are in
CREATE POLICY "Conversations select" ON conversations FOR SELECT
USING (
    id IN (SELECT conversation_id FROM conversation_members WHERE profile_id IN (SELECT get_my_profile_ids()))
    OR
    space_id IN (SELECT space_id FROM space_members WHERE profile_id IN (SELECT get_my_profile_ids()))
);

-- MESSAGES: Visible if you can see the parent conversation
CREATE POLICY "Conversation Messages select" ON messages FOR SELECT
USING (
    conversation_id IN (SELECT id FROM conversations) -- RLS on conversations handles the nested check
);

-- MEMBERS: Visible if you can see the conversation
CREATE POLICY "Conversation Members select" ON conversation_members FOR SELECT
USING (
    conversation_id IN (SELECT id FROM conversations)
);
