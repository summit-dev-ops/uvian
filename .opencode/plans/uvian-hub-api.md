# Uvian Hub API

**Product Guide** | Central Hub REST API for the Uvian Agent Collaboration & Orchestration Platform

---

## Overview

### What is Uvian Hub API?

Uvian Hub API is the central backend service for the Uvian platform, built on Fastify. It provides a comprehensive REST API that handles core platform functionality including real-time chat, collaborative workspaces (Spaces), notes, posts, file assets, user profiles, and account management. The API serves as the primary data layer and integration point for both the web frontend (uvian-web) and AI agents that need to interact with user data and collaborate on tasks.

This API enables the core collaboration experience where users can create Spaces to organize work, have conversations within those Spaces, share notes and posts, upload and manage files, and manage their profiles and accounts. All data is persisted in Supabase (PostgreSQL) with Row Level Security (RLS) policies enforced at the database level, while the API provides an additional layer of business logic and validation.

### Key Capabilities

The Hub API provides five primary capability areas:

**Chat & Messaging**: Real-time conversation management with support for direct messages and Space-based discussions. Users can create conversations, send messages with rich attachments, search message history, and manage conversation membership with role-based permissions (owner, admin, member).

**Spaces**: Collaborative workspace management serving as containers for conversations, notes, posts, and team collaboration. Spaces support member management with roles (owner, admin, member), privacy settings, and configurable settings for team customization.

**Notes**: Document创作 and management within Spaces. Notes support titles, rich text bodies, and file attachments. Users can create, update, and delete notes with full version tracking.

**Posts**: Share-style content creation combining multiple content types (notes, assets, external links) into unified posts that can be shared within Spaces. Posts support rich content composition and provide activity feed entries.

**Assets**: File upload and management with support for direct Supabase Storage integration or external storage providers. Assets can be resolved by ID and support metadata tracking.

**Profiles & Accounts**: User profile management and account (workspace) organization with multi-member support and role-based permissions. Accounts serve as billing and organizational units while profiles represent individual user identities.

### User Value Proposition

Users care about the Hub API because it provides the foundation for their collaborative work:

- **Organized Workspaces**: Spaces provide clean separation for different projects, teams, or topics, keeping conversations and content organized
- **Real-time Collaboration**: Chat and messaging happen in real-time via Socket.IO integration, enabling immediate discussion
- **Rich Content**: Notes, posts with multiple content types, and file attachments enable comprehensive documentation
- **Agent Integration**: AI agents can access and manipulate all platform data through the MCP protocol, enabling powerful automation
- **Access Control**: Role-based permissions ensure the right people have appropriate access levels

Users interact with the Hub API indirectly through the web interface, but power users and developers can also interact directly via the REST API or through AI agents using the MCP tools.

---

## User Workflows

### Creating a New Space

A user creates a Space to organize a new project or team:

1. User authenticates via Supabase Auth (handled by frontend)
2. User calls `POST /api/spaces` with name, optional description, and privacy setting
3. API creates the Space record and adds the creating user as owner
4. API emits `SPACE_CREATED` event for downstream processing
5. User can now invite members, create conversations, add notes

### Starting a Conversation

A user needs to discuss something with team members:

1. User calls `POST /api/conversations` with title and optional Space ID
2. API creates the Conversation and adds creator as owner
3. User calls `POST /api/conversations/:id/conversation-members/invite` to add participants
4. Members receive notifications (through events)
5. Members can now send messages via REST or Socket.IO

### Creating a Post with Multiple Content Types

A user wants to share a comprehensive update:

1. User calls `POST /api/spaces/:spaceId/posts`
2. Post contents can include inline notes, attached assets, and external URLs
3. API creates Post record and content associations
4. Post appears in Space activity feed
5. API emits `POST_CREATED` event

### Uploading a File

A user needs to share a document:

1. User calls `POST /api/assets/upload-url` to get direct upload path
2. User uploads file to Supabase Storage (or external provider)
3. User calls `POST /api/assets` to create asset record with metadata
4. API emits `ASSET_UPLOADED` event
5. Asset can now be attached to notes, messages, or posts

### Agent Collaboration via MCP

An AI agent needs to work with user data:

1. Agent authenticates using API key (prefixed `sk_agent_`)
2. MCP server validates key and issues short-lived JWT
3. Agent calls MCP tools like `list_spaces`, `create_conversation`, `send_message`
4. All operations are scoped to the authenticated user's permissions
5. Events emitted enable workflow automation downstream

---

## Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Fastify |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Real-time | Socket.IO with Redis adapter |
| MCP | @modelcontextprotocol/sdk |
| Validation | Zod |
| Queue | BullMQ with Redis |
| Storage | Supabase Storage |

### Project Structure

```
apps/uvian-hub-api/
├── src/
│   ├── main.ts                     # Entry point
│   └── app/
│       ├── app.ts                  # Fastify app configuration
│       ├── routes/                  # API route handlers
│       │   ├── chat.ts             # Conversations & messages
│       │   ├── spaces.ts           # Workspace management
│       │   ├── posts.ts           # Post CRUD
│       │   ├── notes.routes.ts     # Note CRUD
│       │   ├── assets.ts          # File management
│       │   ├── profiles.ts       # User profiles
│       │   ├── accounts.routes.ts # Account management
│       │   ├── users.ts          # User search
│       │   ├── auth.routes.ts    # Authentication
│       │   └── health.routes.ts # Health checks
│       ├── commands/              # Business logic
│       │   ├── chat/
│       │   ├── space/
│       │   ├── post/
│       │   ├── note/
│       │   └── account/
│       ├── services/              # Data access layer
│       │   ├── chat/
│       │   ├── spaces/
│       │   ├── post/
│       │   ├── note/
│       │   ├── asset/
│       │   └── factory.ts
│       ├── plugins/                # Fastify plugins
│       │   ├── auth.plugin.ts      # Authentication
│       │   ├── mcp.plugin.ts      # MCP server
│       │   ├── event-emitter.ts   # CloudEvents
│       │   ├── socket-io.ts       # Real-time
│       │   ├── bullmq.ts         # Queue
│       │   └── redis-subscriber.ts
│       ├���─ clients/               # External clients
│       │   ├── supabase.client.ts
│       │   └── redis.ts
│       └── types/                  # TypeScript types
└── package.json
```

### Key Services

The Hub API relies on several service packages from the monorepo:

- **@org/services-accounts**: Account and account member management
- **@org/services-users**: User profile and identity management
- **@org/services-profiles**: Profile CRUD operations
- **@org/services-api-key**: Agent API key management
- **@org/services-queue**: Background job queue via BullMQ
- **@org/plugins-event-emitter**: CloudEvents emission

---

## API Reference

### Authentication

All endpoints under `/api/*` require authentication except `/api/health`. Authentication uses Supabase JWT tokens in the `Authorization: Bearer <token>` header.

Agents can authenticate using API keys prefixed with `sk_agent_`. These keys are validated against the `agent_api_keys` table and exchanged for short-lived JWTs.

### Base URL

```
Production: https://api.uvian.com
Development: http://localhost:8000
```

### Endpoints Summary

#### Chat & Conversations

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/conversations` | List user's conversations |
| GET | `/api/conversations/:conversationId` | Get conversation details |
| POST | `/api/conversations` | Create new conversation |
| DELETE | `/api/conversations/:conversationId` | Delete conversation |
| GET | `/api/conversations/:conversationId/conversation-members` | List members |
| POST | `/api/conversations/:conversationId/conversation-members/invite` | Invite member |
| DELETE | `/api/conversations/:conversationId/conversation-members/:userId` | Remove member |
| PATCH | `/api/conversations/:conversationId/conversation-members/:userId/role` | Update role |
| GET | `/api/conversations/:conversationId/messages` | List messages |
| POST | `/api/conversations/:conversationId/messages` | Send message |
| DELETE | `/api/conversations/:conversationId/messages/:messageId` | Delete message |
| PATCH | `/api/conversations/:conversationId/messages/:messageId` | Update message |
| GET | `/api/conversations/:conversationId/messages/search` | Search messages |

#### Spaces

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/spaces` | List accessible spaces |
| GET | `/api/spaces/stats` | Get space statistics |
| GET | `/api/spaces/:spaceId` | Get space details |
| GET | `/api/spaces/:spaceId/members` | List space members |
| POST | `/api/spaces` | Create new space |
| PATCH | `/api/spaces/:spaceId` | Update space |
| DELETE | `/api/spaces/:spaceId` | Delete space |
| POST | `/api/spaces/:spaceId/members/invite` | Invite member |
| DELETE | `/api/spaces/:spaceId/members/:userId` | Remove member |
| PATCH | `/api/spaces/:spaceId/members/:userId/role` | Update role |

#### Posts

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/spaces/:spaceId/posts` | List space posts |
| GET | `/api/posts/:id` | Get post details |
| POST | `/api/spaces/:spaceId/posts` | Create post |
| DELETE | `/api/posts/:id` | Delete post |

#### Notes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/spaces/:spaceId/notes` | List space notes |
| GET | `/api/spaces/:spaceId/notes/:noteId` | Get note details |
| POST | `/api/spaces/:spaceId/notes` | Create note |
| PATCH | `/api/spaces/:spaceId/notes/:noteId` | Update note |
| DELETE | `/api/spaces/:spaceId/notes/:noteId` | Delete note |

#### Assets

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/assets` | List user's assets |
| GET | `/api/assets/:assetId` | Get asset details |
| POST | `/api/assets` | Create asset record |
| DELETE | `/api/assets/:assetId` | Delete asset |
| POST | `/api/assets/upload-url` | Get upload URL |
| POST | `/api/assets/resolve` | Resolve asset IDs to URLs |

#### Profiles

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/profiles/:profileId` | Get profile |
| POST | `/api/profiles` | Create/update profile |
| PATCH | `/api/profiles/:profileId` | Update profile |
| DELETE | `/api/profiles/:profileId` | Delete profile |

#### Accounts

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/accounts` | List user's accounts |
| GET | `/api/accounts/:accountId` | Get account details |
| POST | `/api/accounts` | Create account |
| PATCH | `/api/accounts/:accountId` | Update account |
| GET | `/api/accounts/:accountId/members` | List members |
| POST | `/api/accounts/:accountId/members` | Add member |
| PATCH | `/api/accounts/:accountId/members/:userId` | Update member |
| DELETE | `/api/accounts/:accountId/members/:userId` | Remove member |

#### Users

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/users` | List account users |
| GET | `/api/users/:userId/profile` | Get user profile |
| GET | `/api/users/search` | Search users |

#### MCP (Agent Tools)

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/v1/mcp` | MCP JSON-RPC endpoint |

---

## MCP Tools Reference

The Hub API exposes MCP tools enabling AI agents to interact with user data. All tools are scoped to the authenticated user's permissions.

### Read Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `get_note` | `{ noteId: string }` | Get note by ID |
| `list_conversations` | `{ spaceId?: string }` | List conversations |
| `get_conversation` | `{ conversationId: string }` | Get conversation |
| `list_messages` | `{ conversationId, limit?, cursor? }` | Get messages |
| `list_posts` | `{ spaceId, limit?, cursor? }` | Get posts |
| `get_post` | `{ postId: string }` | Get post |
| `list_spaces` | `{}` | List spaces |
| `get_space` | `{ spaceId: string }` | Get space |
| `get_space_stats` | `{}` | Get space statistics |
| `list_notes` | `{ spaceId, limit?, cursor? }` | Get notes |
| `get_space_members` | `{ spaceId: string }` | Get members |
| `get_conversation_members` | `{ conversationId: string }` | Get members |
| `get_profile` | `{ profileId: string }` | Get profile |
| `get_my_profile` | `{}` | Get current user profile |
| `list_assets` | `{ page?, limit?, type? }` | List assets |
| `get_asset` | `{ assetId: string }` | Get asset |
| `search_messages` | `{ conversationId, q?, senderId?, from?, to?, limit?, offset? }` | Search |

### Write Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `create_space` | `{ name, description?, isPrivate? }` | Create space |
| `update_space` | `{ spaceId, name?, description?, ... }` | Update space |
| `delete_space` | `{ spaceId: string }` | Delete space |
| `create_conversation` | `{ title, spaceId? }` | Create conversation |
| `delete_conversation` | `{ conversationId: string }` | Delete conversation |
| `send_message` | `{ conversationId, content }` | Send message |
| `update_message` | `{ conversationId, messageId, content }` | Update message |
| `delete_message` | `{ conversationId, messageId }` | Delete message |
| `invite_space_member` | `{ spaceId, targetUserId, role? }` | Invite member |
| `remove_space_member` | `{ spaceId, targetUserId }` | Remove member |
| `update_space_member` | `{ spaceId, targetUserId, role }` | Update role |
| `invite_conversation_member` | `{ conversationId, targetUserId, role? }` | Invite member |
| `update_conversation_member` | `{ conversationId, targetUserId, role }` | Update role |
| `update_note` | `{ noteId, title?, body? }` | Update note |
| `delete_note` | `{ noteId: string }` | Delete note |
| `update_profile` | `{ profileId, displayName?, avatarUrl?, bio? }` | Update profile |
| `create_post` | `{ id?, spaceId, contents }` | Create post |
| `delete_post` | `{ postId: string }` | Delete post |
| `generate_share_link` | `{ resourceType, resourceId, view? }` | Generate link |

---

## CloudEvents

The Hub API emits CloudEvents for all major operations, enabling downstream processing by the automation worker and other services.

### Messaging Events

| Event Type | Data |
|------------|------|
| `uvian.conversation.message_created` | MessageCreatedData |
| `uvian.conversation.message_updated` | MessageUpdatedData |
| `uvian.conversation.message_deleted` | MessageDeletedData |
| `uvian.conversation.conversation_created` | ConversationCreatedData |
| `uvian.conversation.conversation_updated` | ConversationUpdatedData |
| `uvian.conversation.conversation_deleted` | ConversationDeletedData |
| `uvian.conversation.member_joined` | ConversationMemberJoinedData |
| `uvian.conversation.member_left` | ConversationMemberLeftData |
| `uvian.conversation.member_role_changed` | ConversationMemberRoleChangedData |

### Space Events

| Event Type | Data |
|------------|------|
| `uvian.space.space_created` | SpaceCreatedData |
| `uvian.space.space_updated` | SpaceUpdatedData |
| `uvian.space.space_deleted` | SpaceDeletedData |
| `uvian.space.member_joined` | SpaceMemberJoinedData |
| `uvian.space.member_left` | SpaceMemberLeftData |
| `uvian.space.member_role_changed` | SpaceMemberRoleChangedData |

### Content Events

| Event Type | Data |
|------------|------|
| `uvian.content.post_created` | PostCreatedData |
| `uvian.content.post_updated` | PostUpdatedData |
| `uvian.content.post_deleted` | PostDeletedData |
| `uvian.content.note_created` | NoteCreatedData |
| `uvian.content.note_updated` | NoteUpdatedData |
| `uvian.content.note_deleted` | NoteDeletedData |
| `uvian.content.asset_uploaded` | AssetUploadedData |
| `uvian.content.asset_deleted` | AssetDeletedData |

### Account Events

| Event Type | Data |
|------------|------|
| `uvian.account.account_created` | AccountCreatedData |
| `uvian.account.account_updated` | AccountUpdatedData |
| `uvian.account.member_added` | AccountMemberAddedData |
| `uvian.account.member_removed` | AccountMemberRemovedData |
| `uvian.account.member_role_changed` | AccountMemberRoleChangedData |

---

## Database Schema

The Hub API uses Supabase PostgreSQL with the following key tables:

### core_hub Schema

| Table | Purpose |
|-------|---------|
| `conversations` | Chat conversations |
| `conversation_members` | Conversation membership with roles |
| `messages` | Messages within conversations |
| `spaces` | Workspace definitions |
| `space_members` | Space membership with roles |
| `posts` | Posts within spaces |
| `post_contents` | Post content items (notes, assets, links) |
| `notes` | Note documents |
| `profiles` | User profiles |

### auth Schema

| Table | Purpose |
|-------|---------|
| `users` | Supabase Auth users |

### public Schema

| Table | Purpose |
|-------|---------|
| `accounts` | Account (billing/org) records |
| `account_members` | Account membership |
| `assets` | Asset metadata records |

All tables use Row Level Security (RLS) policies for access control. The API uses both an admin client (bypasses RLS for writes) and a user-scoped client (enforces RLS for reads).

---

## Integration Points

### Upstream Services

- **uvian-web**: Frontend calls Hub API REST endpoints
- **AI Agents**: Call Hub API via MCP protocol

### Downstream Services

- **uvian-automation-worker**: Consumes CloudEvents for background processing
- **uvian-event-worker**: Additional event processing
- **uvian-discord-connector**: May consume events for Discord sync

### External Dependencies

- **Supabase**: Database, Auth, Storage
- **Redis**: Real-time (Socket.IO), caching, queue

### Queue Integration

The Hub API uses BullMQ with Redis for background jobs:

- Event publishing to CloudEvents system
- Async processing for heavy operations

---

## Error Handling

### REST API Errors

All route handlers follow consistent error patterns:

```typescript
try {
  // operation
  reply.send(result);
} catch (error: any) {
  if (error.message.includes('not found')) {
    reply.code(404).send({ error: 'Resource not found' });
  } else if (error.message.includes('permissions')) {
    reply.code(403).send({ error: 'Insufficient permissions' });
  } else {
    reply.code(400).send({ error: 'Operation failed' });
  }
}
```

Common HTTP codes:

- `400`: Bad request / operation failure
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (permissions denied)
- `404`: Not found
- `500`: Internal server error

### MCP Errors

MCP tools return error responses with `isError: true`:

```typescript
{
  content: [{ type: 'text', text: 'Error: <message>' }],
  isError: true
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HOST` | No | Server host (default: localhost) |
| `PORT` | No | Server port (default: 8000) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Yes | JWT verification secret |
| `REDIS_HOST` | No | Redis host |
| `REDIS_PORT` | No | Redis port |
| `FRONTEND_URL` | No | Frontend URL for CORS |

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Build
npm exec nx build uvian-hub-api

# Start development server
npm exec nx serve uvian-hub-api

# Run tests
npm exec nx test uvian-hub-api
```

### Key Commands

```bash
npm exec nx serve uvian-hub-api          # Development: localhost:8000
npm exec nx build uvian-hub-api      # Production build
npm exec nx typecheck uvian-hub-api  # Type checking
```

---

## Related Documentation

- [Uvian Events Package](/packages/uvian-events) - CloudEvents definitions
- [Uvian Web](/apps/uvian-web) - Frontend application
- [Automation Worker](/apps/uvian-automation-worker) - Background processing
