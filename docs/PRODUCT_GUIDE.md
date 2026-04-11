# Uvian Platform — Product Guide

Uvian is a collaborative AI platform built as an Nx monorepo with 5 apps, 2 shared packages, and 2 database schemas. It provides real-time messaging, collaborative workspaces, AI agents with tool-augmented execution, and event-driven automation.

---

## Platform Overview

```
uvian-web (Next.js 16)
    │  ← User-facing frontend
    │  ← Supabase Auth (JWT)
    ▼
uvian-hub-api (Fastify) ─────────────────────────────────────────────────────────┐
    │  ← REST API, Socket.io, MCP server, CloudEvent emitter                 │
    │                                                                      │
    ├─► BullMQ (Redis)                                                      │
    │         │                                                              │
    │         ▼                                                              │
    │  uvian-event-worker                                               │
    │         │  ← Routes CloudEvents to internal/webhook subscribers       │
    │         ▼                                                              │
    │  uvian-automation-api                                                │
    │         │  ← Agent config, secrets, jobs, webhooks                   │
    │         ▼                                                              │
    │  uvian-automation-worker (Python/LangGraph)                           │
    │         │  ← LangGraph agent executor with MCP tools                  │
    └─────────┘
```

### Apps

| App                       | Type              | Port | Description                          |
| ------------------------- | ----------------- | ---- | ------------------------------------ |
| `uvian-web`               | Next.js 16        | 3000 | User-facing frontend                 |
| `uvian-hub-api`           | Fastify (Node.js) | 8000 | Main REST API, MCP server, Socket.io |
| `uvian-automation-api`    | Fastify (Node.js) | 3001 | Agent config, secrets, job queue     |
| `uvian-automation-worker` | Python            | —    | LangGraph agent executor             |
| `uvian-event-worker`      | Node.js           | —    | BullMQ worker, event router          |

### Packages

| Package             | Description                                  |
| ------------------- | -------------------------------------------- |
| `@org/ui`           | Shared shadcn/ui components (40 components)  |
| `@org/uvian-events` | CloudEvent type definitions and constructors |

---

## Database Schemas

### `public`

Top-level billing and ownership. Only 2 tables plus helper views:

- **`accounts`** — Billing/ownership container with name and metadata
- **`account_members`** — Maps users to accounts with roles (`owner`, `admin`, `member`)

### `core_hub`

Content and collaboration tables moved from `public` in migration 0047:

- **`settings`** — User preferences (JSONB)
- **`profiles`** — User profiles (`human`, `agent`, `system`, `admin`)
- **`assets`** — File/media attachments (linked to Supabase Storage)
- **`spaces`** — Collaborative workspaces
- **`space_members`** — Space membership with roles
- **`conversations`** — Chat channels
- **`conversation_members`** — Conversation membership
- **`messages`** — Chat messages with attachments
- **`posts`** — Content posts within spaces
- **`post_contents`** — Inline content items within posts (notes, assets, links)
- **`notes`** — Notes within spaces
- **`automaton_providers`** — Automation subscriptions per resource (`internal` or `webhook`)
- **`agent_api_keys`** — Agent API key hashes (`sk_agent_...`)
- **`agent_configs`** — Agent metadata (system prompt, skills, config JSONB)
- **`subscriptions`** — Per-resource automation subscriptions (auto-managed by triggers)

Plus 18 views for RLS-safe data access (e.g., `get_my_profile`, `get_conversation_messages`, `get_posts_for_space`).

### `core_automation`

Agent runtime configuration and job processing:

- **`agents`** — Agent configs (system_prompt, skills, max_conversation_history, config JSONB)
- **`llms`** — LLM provider configs (provider, model_name, base_url, temperature, max_tokens)
- **`mcps`** — MCP server configs (name, type, url, auth_method)
- **`secrets`** — Encrypted secrets (api_key, bearer, jwt, api_key_json types)
- **`agent_llms`** — Agent → LLM linking with optional secret_id, is_default flag
- **`agent_mcps`** — Agent → MCP linking with optional secret_id, config JSONB
- **`jobs`** — Background jobs (status: queued/processing/completed/failed/cancelled)
- **`tickets`** — Support/error escalation tickets
- **`process_threads`** — Conversation thread tracking
- **`agent_checkpoints`** — LangGraph state checkpoints per thread

Plus RLS-filtered views: `get_jobs_for_current_user`, `get_job_details`, `get_tickets_for_current_user`.

---

## App 1: uvian-web

**Type:** Next.js 16 (React 19)  
**Port:** 3000  
**Auth:** Supabase Auth (email/password, JWT)

### Pages

#### Public

- `/` — Landing page with feature cards and auth links

#### Auth

- `/auth/sign-in`, `/auth/sign-up` — Email/password auth
- `/auth/reset-password`, `/auth/confirm-sign-up` — Password reset and email confirmation flows

#### Authenticated

- `/home` — Dashboard with navigation cards
- `/chats`, `/chats/[conversationId]` — Conversations and messaging
- `/chats/[conversationId]/members` — Conversation member management
- `/spaces`, `/spaces/[spaceId]` — Spaces and space overview
- `/spaces/[spaceId]/edit` — Edit space settings
- `/spaces/[spaceId]/members`, `/spaces/[spaceId]/posts`, `/spaces/[spaceId]/notes` — Space sections
- `/accounts`, `/accounts/[accountId]` — Account management
- `/accounts/[accountId]/agents`, `/accounts/[accountId]/members` — Account sub-pages
- `/users`, `/users/[userId]` — User profiles
- `/settings` — User settings
- `/onboarding` — New user onboarding (profile creation wizard)
- `/explore`, `/support`, `/support/faq`, `/support/contact` — Discovery and help

### Architecture

**Domain-driven structure** (`lib/domains/[domain]/?):

| Domain     | Purpose                  | Key Types                                         |
| ---------- | ------------------------ | ------------------------------------------------- |
| `chat`     | Real-time messaging      | `MessageUI`, `ConversationUI`, `ConversationMode` |
| `spaces`   | Collaborative workspaces | `SpaceUI`, `SpaceMemberUI`, `SpaceMemberRole`     |
| `profile`  | User profiles            | `ProfileUI` (human/agent/system/admin)            |
| `user`     | Auth and settings        | `SettingsUI`                                      |
| `posts`    | Content posts            | `PostUI`, `PostContent`, `Attachment`             |
| `feed`     | Activity feed            | `FeedItemUI`, `FeedResponse`                      |
| `accounts` | Multi-tenant accounts    | `AccountUI`, `AccountMemberUI`                    |
| `agents`   | AI agent configuration   | `AgentConfigUI`, `AutomationProviderUI`           |
| `support`  | Help center              | `FAQItem`, `SupportTicket`                        |
| `notes`    | Space notes              | `NoteUI`                                          |
| `assets`   | File management          | `AssetUI`, `AssetType`                            |

Each domain has: `api/` (TanStack Query), `types.ts`, `utils.ts`, `store/` (Zustand slice).

### State Management

| Layer        | Solution              | Used For                              |
| ------------ | --------------------- | ------------------------------------- |
| Server state | TanStack Query        | API data, caching, optimistic updates |
| Client state | Zustand + Immer       | Active conversation, drafts, UI state |
| Form state   | React Hook Form + Zod | Validation and form submission        |

**App store slices:** `ChatSlice`, `ProfileSlice`, `UserSlice`, `SpacesSlice`.

### Real-time

**Socket.io** (`NEXT_PUBLIC_SOCKET_URL`) for streaming messages and conversation updates. Socket provider auto-reconnects (5 attempts) and attaches JWT auth token.

### Feature Highlights

- **Chat** — Real-time messaging with @mentions, file attachments, link previews, image lightbox. Message streaming via Socket.io.
- **Spaces** — Collaborative workspaces with posts, notes, and conversations. Member roles (owner/admin/member) with invitation flow.
- **Onboarding** — Multi-step wizard (welcome → profile creation → completion) with eligibility checks.
- **Support** — Help center with FAQ categories and contact form (currently mock data).
- **Agent Config** — Configure AI agents with system prompts, skills, LLM providers, and MCP tools.

---

## App 2: uvian-hub-api

**Type:** Fastify (Node.js)  
**Port:** 8000  
**Auth:** Supabase JWT + Internal API Key + Webhook API Key

### Plugin Architecture

Plugins auto-loaded from `src/app/plugins/` in alphabetical order:

| Plugin             | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `auth.plugin`      | JWT auth — attaches `request.supabase` (RLS-scoped) and `request.user` |
| `bullmq`           | Redis + BullMQ queue (`fastify.queueService`)                          |
| `event-emitter`    | CloudEvent emission to BullMQ `uvian-events` queue                     |
| `mcp.plugin`       | MCP server at `POST /v1/mcp`                                           |
| `redis-subscriber` | Redis pub/sub for Socket.io room broadcasting                          |
| `services`         | Registers all service singletons                                       |
| `socket-io`        | Socket.io with Redis adapter, JWT auth                                 |

### Authentication

Three patterns:

- **JWT** (`authenticate`) — All `/api/*` routes. Supabase JWT verified, RLS-scoped client attached.
- **Internal** (`authenticateInternal`) — `X-API-Key: INTERNAL_API_KEY` header for service-to-service calls.
- **Webhook** (`authenticateWebhook`) — `X-API-Key: SECRET_API_KEY` header for incoming webhooks.

### API Routes

#### Users & Profiles (`/api/users/*`, `/api/profiles/*`)

- `GET /api/users/me` — Current user's account
- `GET /api/users/me/profile`, `GET /api/users/me/settings` — Profile and settings
- `GET /api/users` — All users in account
- `GET /api/users/search` — Search profiles with `searchContext` (exclude existing members)
- `POST/PATCH/DELETE /api/profiles/:id` — Profile CRUD (own profile only)

#### Accounts (`/api/accounts/*`)

- Full CRUD for accounts and account_members (roles: owner/admin/member)
- Auto-creates `internal` automation provider on account creation

#### Spaces (`/api/spaces/*`)

- Full CRUD with member roles (owner/admin/member)
- Space stats, invitation flow, role management

#### Conversations (`/api/conversations/*`)

- Full CRUD with member roles
- Messages with search (query, sender, date range filters)
- Socket.io emits `new_message` to conversation room on create
- Attachment support (mentions, files, links)

#### Posts (`/api/spaces/*/posts`)

- Posts with nested content items (notes, assets, external links)
- Inline note creation within post creation

#### Notes (`/api/spaces/*/notes`)

- CRUD for notes within spaces

#### Assets (`/api/assets/*`)

- Asset records with pre-signed upload URLs (Supabase Storage)
- Signed URL resolution for private assets

#### Feed (`/api/feed/*`)

- Activity feed (post/message/job/ticket events) — currently stubbed (no-op service)

#### Agents (`/api/accounts/*/agents/*`)

- CRUD for agent configs
- Creates Supabase auth user for each agent
- Generates `sk_agent_...` API key
- Calls `uvian-automation-api` init endpoint internally

#### Providers (`/api/accounts/*/providers/*`)

- Automation providers: `internal` (uvian-automation-api) or `webhook`
- Cannot delete the `internal` provider

### MCP Server (`/v1/mcp`)

Stateless HTTP MCP endpoint supporting Supabase JWT or `sk_agent_...` API key auth.

**READ tools:** `get_note`, `list_conversations`, `get_conversation`, `list_messages`, `list_posts`, `get_post`

**WRITE tools:** `create_conversation`, `send_message`, `create_space`, `create_post` (with inline note creation)

### Socket.io

- Redis adapter for horizontal scaling
- `join_conversation` → join Socket.io room (verified via RLS)
- `send_message` → broadcast `new_message` to room
- Redis pub/sub (`conversation:*:messages`) for multi-instance message broadcasting

### Triggers

Auto-created by Supabase triggers on `auth.users` and junction tables:

- `handle_new_user` — Creates account + account_members on first sign-up (skips agents)
- `handle_profile_creation` — Auto-creates profile from user metadata
- `handle_settings_creation` — Auto-creates empty settings
- `handle_conversation_member_sync` — Manages subscriptions on join/leave
- `handle_space_member_sync` — Manages subscriptions on join/leave
- `create_internal_provider_for_account` — Auto-creates `internal` automaton provider

---

## App 3: uvian-automation-api

**Type:** Fastify (Node.js)  
**Port:** 3001  
**Auth:** Supabase JWT + Internal API Key + Webhook API Key

### Purpose

Manages AI agent configurations (LLMs, MCPs, secrets), processes event-driven webhooks, and queues jobs for the Python worker.

### Authentication

| Decorator              | Auth Method                   | Used By                    |
| ---------------------- | ----------------------------- | -------------------------- |
| `authenticate`         | Supabase JWT                  | All `/api/config/*` routes |
| `authenticateInternal` | `X-API-Key: INTERNAL_API_KEY` | Agent init, secrets fetch  |
| `authenticateWebhook`  | `X-API-Key: SECRET_API_KEY`   | Webhook endpoint           |

### API Routes

#### Agent Init (`/api/agents/init`)

Called by `uvian-hub-api` when creating an agent. Encrypts the agent's API key with AES-256-CBC, creates the agent record, and auto-links the Uvian Hub MCP server.

#### Agent Config (`/api/config/agents/*`)

- Full CRUD for agent configs
- Links/unlinks LLMs and MCPs with optional inline secret creation
- `isDefault` flag for default provider selection

#### LLMs (`/api/config/llms/*`)

- CRUD for LLM provider configs (OpenAI-compatible API)
- Fields: provider, model_name, base_url, temperature, max_tokens, config JSONB

#### MCPs (`/api/config/mcps/*`)

- CRUD for MCP server configs
- Auth methods: `api_key`, `bearer`, `jwt`, `api_key_json`
- Auto-creates "Uvian Hub" MCP pointing to `uvian-hub-api /v1/mcp` on agent init

#### Secrets (`/api/config/secrets/*`)

- CRUD for encrypted secrets (AES-256-CBC with `INTERNAL_API_KEY`-derived key)
- Secret types: `api_key`, `bearer`, `jwt`, `api_key_json`
- Secrets orphaned on unlink (retained for reuse)

#### Jobs (`/api/jobs/*`)

- Create/list/cancel/retry/delete jobs
- Status tracking: queued → processing → completed/failed/cancelled

#### Tickets (`/api/tickets/*`)

- Support/error escalation tickets
- Priority levels, assignment, resolution with payload

#### Webhooks (`/api/webhooks/*`)

- `POST /api/webhooks/agents/:agentId/events` — Receives CloudEvents, deduplicates via Redis (24h TTL), dispatches to event handlers, creates jobs in BullMQ

### Encryption

AES-256-CBC with SHA-256 derived key from `INTERNAL_API_KEY`. Format: `iv_hex:encrypted_hex`. Decrypted on-demand when worker fetches agent secrets.

---

## App 4: uvian-automation-worker

**Type:** Python (FastAPI-style worker)  
**Queue:** BullMQ (`main-queue`) on Redis

### Purpose

Executes AI agents using LangGraph with tool-augmented LLM execution. Processes event-driven jobs from the automation API.

### Architecture

```
BullMQ Worker (main.py)
    │
    ├─► DependencyContainer → ExecutorFactory
    │          │
    │          ├─► ChatExecutor
    │          └─► AgentExecutor
    │
    ├─► TriggerRegistry (event handlers)
    │          │
    │          ├─► MessageCreatedTrigger
    │          ├─► TicketCreatedTrigger
    │          ├─► PostCreatedTrigger
    │          └─► ... (space, note, asset, job triggers)
    │
    └─► LangGraph Agent (UniversalAgent)
             │
             ├─► LLM: MiniMax (Opencode AI) or RunPod
             ├─► Tools: Base tools + MCP tools (from agent config)
             ├─► Memory: PostgresAsyncCheckpointer (Supabase)
             └─► Streaming: Redis pub/sub
```

### Job Processing

1. Worker picks up job from `main-queue`
2. If event-based (`message.*`, `ticket.*`, etc.), routes to `AgentExecutor`
3. Loads agent secrets from `uvian-automation-api` (`GET /api/agents/:userId/secrets`)
4. Builds MCP tool registry from agent's linked MCPs
5. Creates/loads process thread
6. Executes LangGraph agent with checkpointing
7. Streams results via Redis pub/sub
8. Updates job status to completed/failed

### Event Triggers

13 trigger types handled via `TriggerRegistry`:
`message.created`, `conversation.member_joined`, `ticket.created`, `ticket.updated`, `post.created`, `note.updated`, `asset.uploaded`, `space.member_joined`, `space.member_role_changed`, `space.created`, `job.created`, `job.cancelled`, `job.retry`

### Universal Agent (LangGraph)

Graph-based workflow with nodes: `check_context_node` → `model_node` ↔ `tool_node` → `response_node`

**State:** Message history, LLM call counter, transcript, skills, conversation_id, checkpoint metadata.

**LLM Options:** MiniMax (Opencode AI, default) or RunPod (NousResearch/Hermes).

### Tools

**Built-in:** `search_skills`, `load_skill`

**MCP tools:** Dynamically loaded from agent's linked MCP servers via `langchain_mcp_adapters`. Auth headers constructed per MCP config (bearer, api_key, jwt with 1h expiry).

### Checkpointing

`PostgresAsyncCheckpointer` serializes LangGraph state to `core_automation.agent_checkpoints` via Supabase. Supports resume from checkpoint for long-running conversations.

---

## App 5: uvian-event-worker

**Type:** Node.js BullMQ worker  
**Queue:** `uvian-events`

### Purpose

Routes CloudEvents from `uvian-hub-api` to subscribed automation providers (internal or webhook).

### Event Flow

```
uvian-hub-api (BullMQ: uvian-events) → uvian-event-worker → EventRouter
                                                      │
                                    ┌─────────────────┴─────────────────┐
                                    ▼                                   ▼
                          internal provider                 webhook providers
                          (uvian-automation-api)            (external URLs)
                          POST /api/webhooks/               POST {url}
                            agents/:id/events                with auth headers
```

### Routing Logic

1. Parse CloudEvent `source` path → `{type, id}` (e.g., `/conversations/123`)
2. Query `core_hub.get_subscription_providers_for_resource` (5-min Redis cache)
3. For each provider:
   - `internal` → POST to `AUTOMATION_API_URL/api/webhooks/agents/:dependent_user_id/events`
   - `webhook` → POST to configured URL with bearer/api_key auth

**Member events** (`member_joined`, `member_left`) → cache invalidation only, no routing.

---

## Shared: @org/ui Package

**Location:** `packages/ui/`

40 shadcn/ui components built on Radix UI primitives:

| Category     | Components                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Layout       | accordion, card, sidebar, sheet, drawer                                                        |
| Input        | button, input, textarea, input-otp, input-group, select, checkbox, radio-group, toggle, switch |
| Feedback     | alert, badge, spinner, progress, skeleton, tooltip, sonner (toasts), empty                     |
| Navigation   | breadcrumb, tabs, pagination                                                                   |
| Data Display | avatar, table, item, separator, scroll-area, hover-card                                        |
| Overlay      | dialog, label, field                                                                           |
| Utilities    | carousel, slider                                                                               |

Plus hooks: `use-mobile`, `use-toast`. Utility: `cn()` (clsx + tailwind-merge).

---

## Shared: @org/uvian-events Package

**Location:** `packages/uvian-events/`

CloudEvent (spec 1.0) type definitions and constructors for all platform events.

### Event Domains

| Domain    | Events                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Messaging | `message_created`, `message_updated`, `message_deleted`, `conversation_created`, `conversation_updated`, `conversation_deleted`, `member_joined`, `member_left` |
| Spaces    | `space_created`, `space_updated`, `space_deleted`, `member_joined`, `member_left`, `member_role_changed`                                                        |
| Content   | `post_created`, `post_updated`, `post_deleted`, `note_created`, `note_updated`, `note_deleted`, `asset_uploaded`, `asset_deleted`                               |
| Jobs      | `job_created`, `job_started`, `job_completed`, `job_failed`, `job_cancelled`, `job_retry`                                                                       |
| Tickets   | `ticket_created`, `ticket_updated`, `ticket_resolved`, `ticket_closed`, `ticket_assigned`                                                                       |
| Accounts  | `account_created`, `account_updated`, `member_added`, `member_removed`, `member_role_changed`                                                                   |
| Agents    | `agent_created`, `agent_updated`, `agent_deleted`, `agent_activated`, `agent_deactivated`                                                                       |

All events use `com.uvian` prefix (e.g., `com.uvian.conversation.message_created`).

---

## Key Design Patterns

### RLS Pattern

Every authenticated HTTP request gets a scoped Supabase client (RLS-enforced reads). Writes use `adminSupabase` (service role) but validate permissions in the service layer first.

### CloudEvent Flow

`uvian-hub-api` emits events to BullMQ `uvian-events` queue → `uvian-event-worker` routes to subscribers → `uvian-automation-api` receives internal events → creates jobs → `uvian-automation-worker` executes.

### Agent Initialization

User creates agent in `uvian-web` → `uvian-hub-api` creates auth user + API key → calls `uvian-automation-api /api/agents/init` → automation-api creates agent record + encrypts API key + creates Uvian Hub MCP → worker can now use agent.

### Secrets Management

API keys stored in `core_automation.secrets` (AES-256-CBC encrypted). Worker fetches decrypted secrets at runtime via internal API call.

### LangGraph Checkpointing

Agent conversation state persisted to `core_automation.agent_checkpoints`. Supports resume from checkpoint for fault tolerance.

---

## Environment Variables

| App                       | Key Variables                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uvian-web`               | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`                                               |
| `uvian-hub-api`           | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `REDIS_HOST/PORT/PASSWORD`, `UVIAN_AUTOMATION_API_URL`, `UVIAN_AUTOMATION_API_KEY`, `FRONTEND_URL`  |
| `uvian-automation-api`    | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `REDIS_HOST/PORT`, `INTERNAL_API_KEY`, `SECRET_API_KEY`                                               |
| `uvian-automation-worker` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `REDIS_HOST/PORT`, `INTERNAL_API_KEY`, `UVIAN_AUTOMATION_API_URL`, `UVIAN_MCP_URL`, `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` |
| `uvian-event-worker`      | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `REDIS_HOST/PORT`, `AUTOMATION_API_URL`, `AUTOMATION_API_KEY`                                                             |
