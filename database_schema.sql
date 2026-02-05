-- ============================================================================
-- UVIAN CHAT APPLICATION DATABASE SCHEMA
-- Supabase/PostgreSQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_created_at ON conversations (created_at DESC);
CREATE INDEX idx_conversations_updated_at ON conversations (updated_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_created_at ON messages (created_at);
CREATE INDEX idx_messages_role ON messages (role);

-- ============================================================================
-- CONVERSATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE conversation_members (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role JSONB DEFAULT '{"name": "member"}', -- Flexible role structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (profile_id, conversation_id)
);

-- Indexes for conversation members
CREATE INDEX idx_conversation_members_conversation_id ON conversation_members (conversation_id);
CREATE INDEX idx_conversation_members_profile_id ON conversation_members (profile_id);
CREATE INDEX idx_conversation_members_role ON conversation_members USING GIN (role);

-- ============================================================================
-- JOBS TABLE (Background Processing)
-- ============================================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('chat', 'task')), -- Job type discriminator
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    input JSONB, -- Job input parameters
    output JSONB, -- Job result data
    error_message TEXT, -- Error details if failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE, -- When processing started
    completed_at TIMESTAMP WITH TIME ZONE -- When processing finished
);

-- Indexes for jobs
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_type ON jobs (type);
CREATE INDEX idx_jobs_created_at ON jobs (created_at DESC);
CREATE INDEX idx_jobs_input ON jobs USING GIN (input);
CREATE INDEX idx_jobs_output ON jobs USING GIN (output);

-- ============================================================================
-- PROFILE TYPES
-- ============================================================================
CREATE TYPE profile_type AS ENUM ('human', 'agent', 'system', 'admin');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Link to Supabase Auth. Nullable because Agents don't have logins.
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type profile_type NOT NULL DEFAULT 'human',
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    -- Agent specific config (e.g., Model ID, Temperature) - NULL for humans
    agent_config JSONB,
    -- Extensible public profile data
    public_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure 1:1 mapping for humans, but allow multiple agents without auth
    CONSTRAINT uniq_auth_user UNIQUE (auth_user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for profiles
CREATE INDEX idx_profiles_type ON profiles (type);
CREATE INDEX idx_profiles_display_name ON profiles (display_name);
CREATE INDEX idx_profiles_public_fields ON profiles USING GIN (public_fields);
CREATE INDEX idx_profiles_auth_user_id ON profiles (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- PROFILE SETTINGS TABLE
-- ============================================================================
CREATE TABLE profile_settings (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}', -- Flexible profile settings data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for profile_settings
CREATE INDEX idx_profile_settings_public_fields ON profile_settings USING GIN (settings);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT AUTOMATION
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_settings_updated_at
    BEFORE UPDATE ON profile_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONVERSATIONS RLS POLICIES
-- ============================================================================

-- Users can view conversations they're members of
CREATE POLICY "Users can view conversations they are members of" ON conversations
    FOR SELECT
    USING (
        id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update conversations they're members of
CREATE POLICY "Users can update conversations they are members of" ON conversations
    FOR UPDATE
    USING (
        id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can delete conversations they're admin members of
CREATE POLICY "Admins can delete conversations" ON conversations
    FOR DELETE
    USING (
        id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
            AND (role->>'name' = 'admin' OR role = '"admin"')
        )
    );

-- ============================================================================
-- MESSAGES RLS POLICIES
-- ============================================================================

-- Users can view messages in conversations they're members of
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can create messages in conversations they're members of
CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE
    USING (
        -- For system and assistant messages, check membership
        CASE
            WHEN role = 'user' THEN
                -- Allow users to update their own user messages
                sender_id IN (
                    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
                )
            ELSE
                -- For system/assistant messages, require admin role
                conversation_id IN (
                    SELECT conversation_id
                    FROM conversation_members
                    WHERE profile_id IN (
                        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
                    )
                    AND (role->>'name' = 'admin' OR role = '"admin"')
                )
        END
    );

-- Users can delete messages in conversations they're admin members of
CREATE POLICY "Admins can delete messages" ON messages
    FOR DELETE
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
            AND (role->>'name' = 'admin' OR role = '"admin"')
        )
    );

-- ============================================================================
-- CONVERSATION MEMBERS RLS POLICIES
-- ============================================================================

-- Users can view members of conversations they're part of
CREATE POLICY "Users can view conversation members" ON conversation_members
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Users can invite members to conversations they're admin members of
CREATE POLICY "Admins can invite members" ON conversation_members
    FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
            AND (role->>'name' = 'admin' OR role = '"admin"')
        )
    );

-- Admins can update member roles
CREATE POLICY "Admins can update member roles" ON conversation_members
    FOR UPDATE
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
            AND (role->>'name' = 'admin' OR role = '"admin"')
        )
    );

-- Admins and users can remove members
CREATE POLICY "Admins and self can remove members" ON conversation_members
    FOR DELETE
    USING (
        -- Admin can remove anyone
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_members
            WHERE profile_id IN (
                SELECT id FROM profiles WHERE auth_user_id = auth.uid()
            )
            AND (role->>'name' = 'admin' OR role = '"admin"')
        )
        OR
        -- Users can remove themselves
        profile_id IN (
            SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- JOBS RLS POLICIES
-- ============================================================================

-- Jobs are system-level - typically managed by service role
-- For development, allow authenticated users to read their own jobs
-- In production, this would be handled by the API service role

CREATE POLICY "Authenticated users can view jobs" ON jobs
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage jobs" ON jobs
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- System profiles are readable by authenticated users
CREATE POLICY "System profiles are readable by authenticated users" ON profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL OR type IN ('system', 'admin')
    );

-- Humans can manage their own profile
CREATE POLICY "Humans can manage their own profile" ON profiles
    FOR ALL
    USING (auth_user_id = auth.uid());

-- System/Admin profiles are readable by authenticated users
CREATE POLICY "System/Admin profiles are readable by authenticated users" ON profiles
    FOR SELECT
    USING (type IN ('system', 'admin') OR auth_user_id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.auth_user_id = auth.uid() 
            AND p.type = 'admin'
        )
    );

-- Agents can be managed by humans (for creating agent profiles)
CREATE POLICY "Humans can manage agent profiles" ON profiles
    FOR ALL
    USING (
        type = 'agent' AND auth_user_id IS NOT NULL
    );

-- ============================================================================
-- PROFILE SETTINGS RLS POLICIES
-- ============================================================================

-- Profile owners can manage their own settings
CREATE POLICY "Profile owners can manage their settings" ON profile_settings
    FOR ALL
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- System profiles have public settings
CREATE POLICY "System profile settings are readable" ON profile_settings
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE type IN ('system', 'admin')
        )
    );

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View to get conversations with member counts and last message
CREATE VIEW conversations_with_metadata AS
SELECT
    c.*,
    COUNT(DISTINCT cm.profile_id) as member_count,
    COUNT(DISTINCT m.id) as message_count,
    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
    (SELECT role FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_role,
    (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
    CASE
        WHEN cm.user_id IS NOT NULL THEN true
        ELSE false
    END as is_member
FROM conversations c
LEFT JOIN conversation_members cm ON c.id = cm.conversation_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, cm.user_id;

-- ============================================================================
-- SAMPLE DATA (For Development)
-- ============================================================================

-- Insert initial system profiles
INSERT INTO profiles (id, type, display_name, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'system', 'System', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'Administrator', true);

-- Insert a sample conversation
INSERT INTO conversations (id, title) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Welcome to Uvian');

-- Insert a sample message with system sender
INSERT INTO messages (id, conversation_id, sender_id, content, role) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'Welcome to Uvian! Your AI-powered chat platform.',
        'system'
    );

-- Insert a sample job
INSERT INTO jobs (id, type, status, input, output) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440004',
        'chat',
        'completed',
        '{"conversationId": "550e8400-e29b-41d4-a716-446655440002", "messages": [{"role": "user", "content": "Hello!"}]}',
        '{"text": "Hello! How can I help you today?"}'
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS 'Chat conversations created by profiles';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE conversation_members IS 'Profile membership and roles in conversations';
COMMENT ON TABLE profiles IS 'Unified profiles for humans, agents, system, and admin entities';
COMMENT ON TABLE profile_settings IS 'Settings for profiles (humans, agents, system, admin)';
COMMENT ON TABLE jobs IS 'Background job queue for async processing';
COMMENT ON COLUMN conversation_members.role IS 'Flexible role structure stored as JSONB (e.g., {"name": "admin"} or {"name": "member", "permissions": []})';
COMMENT ON COLUMN profiles.type IS 'Type of profile: human, agent, system, or admin';
COMMENT ON COLUMN profiles.agent_config IS 'Agent-specific configuration (NULL for humans)';
COMMENT ON COLUMN profiles.auth_user_id IS 'Link to Supabase Auth user (NULL for agents)';
COMMENT ON COLUMN jobs.input IS 'Job input parameters as JSONB';
COMMENT ON COLUMN jobs.output IS 'Job result data as JSONB';