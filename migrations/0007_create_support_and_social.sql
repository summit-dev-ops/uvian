-- =============================================================================
-- PHASE 8: SUPPORT + SOCIAL
-- Migration: 0007_create_support_and_social.sql
-- Purpose: Create tickets, events, posts, feed_items tables
-- =============================================================================

-- =============================================================================
-- TICKETS TABLE
-- =============================================================================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES process_threads(id) ON DELETE SET NULL,
  resource_scope_id UUID REFERENCES resource_scopes(id) ON DELETE SET NULL,
  requester_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  resolution_payload JSONB,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('post', 'message', 'job', 'ticket')),
  event_type TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_scope_id UUID REFERENCES resource_scopes(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- POSTS TABLE
-- =============================================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'url')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- FEED ITEMS TABLE
-- =============================================================================

CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('post', 'message', 'job', 'ticket')),
  event_type TEXT,
  source_id UUID,
  source_type TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

-- Ticket policies
CREATE POLICY "Users can view tickets in their scope"
  ON tickets FOR SELECT
  USING (
    resource_scope_id IN (
      SELECT rs.id FROM resource_scopes rs
      WHERE rs.space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
    )
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Event policies (read-only, created by system)
CREATE POLICY "Users can view events in their scope"
  ON events FOR SELECT
  USING (
    resource_scope_id IN (
      SELECT rs.id FROM resource_scopes rs
      WHERE rs.space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
      OR rs.conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
    )
    OR actor_id = auth.uid()
  );

-- Post policies
CREATE POLICY "Users can view posts in their spaces"
  ON posts FOR SELECT
  USING (
    space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Space members can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND space_id IN (SELECT space_id FROM space_members WHERE user_id = auth.uid())
  );

-- Feed item policies
CREATE POLICY "Users can view their feed"
  ON feed_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create feed items"
  ON feed_items FOR INSERT
  WITH CHECK (user_id = auth.uid());
