# Uvian Discord Connector - Product Guide

> **Status**: Active | **Platform**: Fastify + discord.js | **Deployment**: Railway

## Overview

The **Uvian Discord Connector** is the official bridge between Uvian's agent orchestration platform and Discord. It enables users to interact with AI agents directly through Discord, while giving those agents the ability to read messages, send responses, and manage Discord channels programmatically.

This is one of Uvian's key **external connector services**—alongside email, Slack, and webhooks—that expand the platform's reach beyond its native web interface.

---

## What Is This App?

The Discord Connector is a Fastify-based microservice that:

1. **Connects to Discord via WebSocket** using discord.js (v14) as a bot
2. **Emits Discord events** into Uvian's event system (CloudEvents + BullMQ)
3. **Exposes an MCP server** so AI agents can interact with Discord programmatically
4. **Provides slash commands** for account linking and agent activation

In essence, it turns Discord into another frontend for Uvian agents—a place where users can chat with AI assistants, link their accounts, and manage agent subscriptions.

---

## Key Features

### 1. Discord Bot Gateway (WebSocket)

The connector maintains a persistent WebSocket connection to Discord using discord.js. This connection handles:

- **Message events** (`messageCreate`) — listens for user messages in DMs and servers
- **Interaction events** (`interactionCreate`) — handles slash commands, buttons, modals, and context menus
- **Ready/error handling** — logs connection status and handles reconnection

The bot requires two environment variables:
- `DISCORD_BOT_TOKEN` — the bot's authentication token
- `DISCORD_APPLICATION_ID` — the Discord application ID (for registering slash commands)

### 2. Slash Commands

Three slash commands are registered with Discord:

| Command | Description | Auth Required |
|---|---|---|
| `/link` | Links your Discord account to Uvian via an intake form | No |
| `/activate agent:<name>` | Activates an agent in the current channel (DM or server channel) | Yes (must be linked) |
| `/deactivate` | Deactivates the currently active agent in the channel | Yes (must be linked) |

The `/link` command generates an RSA keypair and creates an intake form (via the Intake API) that the user completes to link their Discord account to their Uvian account. This is the **account linking workflow**.

The `/activate` and `/deactivate` commands enable **agent provisioning**—users can subscribe an agent to a Discord channel, and the agent gains access to that channel through MCP tools.

### 3. MCP Server (Model Context Protocol)

The connector exposes an MCP server at `POST /v1/mcp` with **15 Discord-specific tools** that AI agents can call. These tools allow agents to:

- **Send messages** — to DMs or channel
- **Read messages** — recent, before, after, by ID, search, thread messages
- **Query Discord objects** — users, channels, guilds, members, threads
- **Get reactions** — on any message

#### MCP Tools (15 total)

| Tool | Description |
|---|---|
| `discord_send_dm` | Send a direct message to a Discord user |
| `discord_send_channel` | Send a message to a specific channel |
| `discord_get_user` | Fetch a Discord user by ID |
| `discord_get_recent_messages` | Get the most recent N messages in a channel |
| `discord_get_messages_before` | Get messages before a specific message ID |
| `discord_get_messages_after` | Get messages after a specific message ID |
| `discord_get_message` | Get a single message by ID |
| `discord_search_channel_messages` | Search messages in a channel by text query |
| `discord_get_thread_messages` | Get messages in a thread channel |
| `discord_get_thread_info` | Get metadata about a thread |
| `discord_get_guild_info` | Get a Discord server's info |
| `discord_get_guild_channels` | List all channels in a server |
| `discord_get_member` | Get a server member's info |
| `discord_get_channel_info` | Get a channel's info |
| `discord_get_message_reactions` | Get reactions on a message |

All MCP tools are rate-limited using Redis (10 requests per 10-second sliding window) to prevent abuse.

#### MCP Authentication

The MCP server supports two authentication methods:

1. **API key** — passed as a Bearer token starting with `sk_agent_`; validated against the `agent_api_keys` table
2. **JWT** — a Supabase-issued JWT with the `authenticated` role; validated using `SUPABASE_JWT_SECRET`

When an agent is activated in a Discord channel (via `/activate`), the system provisions an API key scoped to that agent, which is then used to authenticate MCP requests.

### 4. Event Emission

The connector emits Discord events into Uvian's event system (BullMQ queue). These events are serialized as CloudEvents and can be consumed by downstream services or agent workflows.

#### Event Types

| Event | Description | Data Shape |
|---|---|---|
| `uvian.discord.message_created` | User sent a message | `DiscordMessageCreatedData` |
| `uvian.discord.interaction_received` | User triggered a slash command, button, modal, or context menu | `DiscordInteractionData` |

#### Event Payloads

**DiscordMessageCreatedData:**
```typescript
{
  messageId: string;
  content: string;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId: string;
  guildId?: string;
  isDm: boolean;
}
```

**DiscordInteractionData:**
```typescript
{
  interactionType: number;
  interactionTypeName: string;
  commandName?: string;
  customId?: string;
  options?: Array<{ name: string; value: string }>;
  values?: string[];
  modalData?: Record<string, string>;
  externalChannelId: string;
  externalUserId: string;
  externalMessageId?: string;
  guildId?: string;
  isDm: boolean;
}
```

### 5. Rate Limiting

Redis-backed sliding window rate limiting protects the MCP server:
- **Limit**: 10 requests per 10 seconds per API key
- **Implementation**: Redis INCR + EXPIRE commands

---

## User Value — Why Does a User Care?

### 1. Use Discord as an Agent Interface

Users spend significant time in Discord—servers, DMs, threads. The connector lets them interact with Uvian agents *inside Discord* without leaving the platform. This is especially valuable for:

- **Community managers** who want AI assistants in their Discord servers
- **Support teams** who want agents to handle DMs
- **Developers** who prefer Discord's real-time chat over web UIs

### 2. Account Linking

The `/link` command provides a secure way to connect a Discord identity to a Uvian account. The flow uses RSA keypair handoff via the Intake API, ensuring that:

- The user authenticates with Uvian (via the intake form)
- A cryptographically secure keypair is generated
- The Discord account is linked to the Uvian account in the identity table

### 3. Agent Provisioning

Users can activate specific agents in specific channels using `/activate`. This enables:

- **Per-channel agent subscriptions** — different agents in different channels
- **DM agent access** — agents can respond to DMs
- **Scoped MCP access** — the agent only gets MCP tools when provisioned to a channel

This is a powerful feature for multi-tenant agent deployments.

---

## User Workflows and Use Cases

### Workflow 1: Link Discord Account

1. User runs `/link` in Discord
2. Connector generates an RSA keypair and creates an intake form via the Intake API
3. User receives a link to complete the intake form
4. User signs in to Uvian and completes the form
5. Discord account is now linked to the Uvian account

### Workflow 2: Activate an Agent in a Channel

1. User runs `/activate agent:assistant` (or similar)
2. Connector verifies the user is linked
3. Connector searches for the agent by name
4. Connector creates a subscription (`discord.channel` -> channel ID)
5. Connector emits `MCP_PROVISIONING_REQUESTED` event
6. Agent is now accessible in that channel via MCP

### Workflow 3: Agent Responds to Messages

1. User sends a message in a Discord channel where an agent is activated
2. Connector emits `discord.message_created` event
3. Agent receives the event via its workflow
4. Agent processes the message and sends a response via the MCP tool `discord_send_channel`
5. User sees the agent's response in Discord

---

## How It Fits Into the Overall Platform

The Discord Connector is one of Uvian's **external connector services**. Here is where it fits in the architecture:

```
                    ┌─────────────────────┐
                    │   uvian-web         │ (Next.js frontend)
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   uvian-hub-api     │ (Fastify API)
                    └─────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  Email      │  │  Discord    │  │  Slack     │
    │  Connector  │  │  Connector │  │  Connector │
    └─────────────┘  └─────────────┘  └─────────────┘
```

Each connector:
- Maintains a WebSocket or polling connection to its platform
- Emits events into the Uvian event system
- Exposes an MCP server for agents to interact with the platform
- Provides slash/webhook/email commands for account linking and agent provisioning

The Discord Connector specifically:
- Connects via **discord.js WebSocket gateway**
- Emits **discord.message_created** and **discord.interaction_received** events
- Exposes **15 MCP tools** for Discord operations
- Provides **3 slash commands** for linking and activation

---

## Technical Architecture

### Framework and Key Libraries

| Technology | Purpose |
|---|---|
| **Fastify** | HTTP server framework |
| **discord.js** | Discord WebSocket gateway (v14) |
| **@modelcontextprotocol/sdk** | MCP server implementation |
| **ioredis** | Redis client for caching and rate limiting |
| **BullMQ** | Event queue for CloudEvents |
| **_supabase_ (JS client)** | Database client |
| **zod** | Runtime validation for MCP tool inputs |
| **bcryptjs** | API key hashing |
| **jsonwebtoken** | JWT verification for MCP auth |

### Key Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check |
| `GET` | `/api/interactions` | None | Liveness probe |
| `POST` | `/api/interactions` | None | Discord PING callback (required for endpoint verification) |
| `POST` | `/api/auth/api-key` | Internal | Create Discord-scoped API key for an agent |
| `POST` | `/v1/mcp` | Bearer | MCP server (stateless JSON-RPC) |
| `GET` | `/v1/mcp` | None | Returns 405 (method not allowed) |

### Key Plugins (Auto-Loaded)

| Plugin | Purpose |
|---|---|
| `gateway.ts` | Discord WebSocket gateway + slash command handlers |
| `mcp.plugin.ts` | MCP server with 15 Discord tools |
| `event-emitter.ts` | DiscordEventEmitter (extends BaseEventEmitter) |
| `cache.ts` | Redis connection + CacheService (includes rate limiting) |
| `internal-auth.ts` | Internal API key + JWT authentication decorator |

### Key Services

| Service | Purpose |
|---|---|
| `identityService` | Look up linked Discord identities by provider user ID |
| `subscriptionService` | Activate/deactivate agent subscriptions to Discord channels |
| `userService` | Search for users and agents by name |
| `apiKeyService` | Create and manage Discord-scoped API keys |

---

## Integration Points

### Integration with uvian-intake-api

The `/link` command creates an intake form via the Intake API:

```
POST {INTAKE_API_URL}/api/intakes
Headers: { 'x-api-key': INTAKE_API_KEY }
Body: {
  title: 'Link Discord Account',
  description: 'Link your Discord account (@{username}) to your Uvian account',
  metadata: { type: 'discord_link', discordUserId, discordUsername },
  publicKey: <RSA public key>,
  requiresAuth: true,
  expiresInSeconds: 300,
  createdBy: 'discord-bot'
}
```

The resulting intake URL is sent to the user as an ephemeral Discord message.

### Integration with Agent Provisioning

When `/activate` is run, the connector:
1. Creates a subscription (`subscriptionService.activateSubscription`)
2. Emits `MCP_PROVISIONING_REQUESTED` event (via `CoreEvents.MCP_PROVISIONING_REQUESTED`)

This event is consumed by the automation worker or agent provisioning service, which sets up the MCP endpoint for the agent.

### Integration with Supabase (Database)

All data is stored in Supabase:

- **identities** — maps Discord user IDs to Uvian user IDs
- **subscriptions** — tracks active agent-channel subscriptions
- **agent_api_keys** — stores hashed API keys for MCP authentication
- **accounts** / **account_members** — for agent account resolution

---

## Environment Variables

| Variable | Required | Purpose | Default |
|---|---|---|---|
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token | — |
| `DISCORD_APPLICATION_ID` | Yes | Discord application ID | — |
| `SUPABASE_URL` | Yes | Supabase project URL | — |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key | — |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key | — |
| `SUPABASE_JWT_SECRET` | Yes | JWT verification secret | — |
| `SECRET_INTERNAL_API_KEY` | Yes | Internal service auth key | — |
| `INTAKE_API_URL` | Yes | Intake API URL | `http://localhost:8001` |
| `DISCORD_CONNECTOR_URL` | Yes | Self-referential URL for MCP | `http://localhost:4000` |
| `PORT` | No | Server port | `3003` |
| `HOST` | No | Server host | `localhost` |
| `FRONTEND_URL` | No | CORS origin | `*` |
| `REDIS_HOST` | No | Redis host | `localhost` |
| `REDIS_PORT` | No | Redis port | `6379` |
| `REDIS_PASSWORD` | No | Redis password | — |
| `REDIS_USERNAME` | No | Redis username | — |

---

## Deployment

- **Platform**: Railway
- **Start command**: `npx nx run @org/uvian-discord-connector:serve`
- **Health check**: `GET /api/health` (30s timeout)
- **Restart policy**: `on_failure` (production), `always` (staging)
- **Watch patterns**:
  - `apps/uvian-discord-connector/**`
  - `nx.json`
  - `package.json`
  - `package-lock.json`
  - `tsconfig.base.json`

---

## Data Models

### Identity Resolution

When a Discord message or interaction is received, the connector resolves the sender:

1. Look up the Discord user ID in the `identities` table via `identityService.admin().getIdentityByProviderUserId('discord', discordUserId)`
2. If found → use the Uvian `user_id` as the `senderId`
3. If not found → use `'external'` as the `senderId`

This determines whether the event comes from a linked Uvian user or an external/unknown user.

### Account Linking Flow

1. User runs `/link`
2. Connector generates an RSA keypair (`@org/utils-encryption`)
3. Connector creates an intake via the Intake API (type: `discord_link`)
4. User completes the intake form (signs in to Uvian)
5. On completion, the intake API creates an identity record linking the Discord user ID to the Uvian user ID

### Agent Activation Flow

1. User runs `/activate agent:assistant`
2. Connector verifies the user is linked (not `'external'`)
3. Connector searches for the agent via `userService.admin().searchUsers()`
4. Connector resolves the agent's account via `account_members` table
5. Connector activates a subscription: `subscriptionService.scoped().activateSubscription(agent.id, 'discord.channel', channelId)`
6. Connector emits `MCP_PROVISIONING_REQUESTED` event
7. Downstream services provision the MCP endpoint for the agent

---

## Security Considerations

1. **MCP API key authentication** — API keys are hashed with bcrypt before storage; only the prefix is stored in plaintext for lookup
2. **Rate limiting** — Redis-backed sliding window prevents MCP tool abuse
3. **JWT verification** — MCP JWTs are verified against `SUPABASE_JWT_SECRET`
4. **Internal API key** — The `/api/auth/api-key` route is protected by `SECRET_INTERNAL_API_KEY`
5. **Link intent verification** — The link flow uses a 5-minute expiry on the intake form to reduce attack surface
6. **Bot message filtering** — The gateway ignores messages from bots to prevent loops

---

## Monitoring and Observability

- **Health endpoint**: `GET /api/health` returns `{ status: 'ok', service: 'uvian-discord-connector', timestamp }`
- **Logging**: Fastify logger (Pino) with structured JSON logs
- **Error handling**: All Discord event handlers are wrapped in try-catch with logging

---

## Running Locally

```bash
# Build the app
npx nx build @org/uvian-discord-connector

# Serve in development mode
npx nx serve @org/uvian-discord-connector

# Run tests (if any)
npx nx test @org/uvian-discord-connector

# Lint
npx nx lint @org/uvian-discord-connector

# Typecheck
npx nx typecheck @org/uvian-discord-connector
```

---

## Related Documentation

- [Uvian Events Package](/packages/uvian-events) — for `DiscordEvents` and event type definitions
- [uvian-intake-api](/apps/uvian-intake-api) — for intake form handling during account linking
- [uvian-hub-api](/apps/uvian-hub-api) — central API gateway
- [MCP Protocol](https://modelcontextprotocol.io) — for MCP server specification
- [discord.js](https://discord.js.org) — for Discord bot API

---

## Summary

The **Uvian Discord Connector** is a critical piece of Uvian's external integration strategy. It enables:

- **User-facing**: Discord as a chat interface for Uvian agents
- **Agent-facing**: MCP tools for agents to read and write Discord content
- **System-facing**: Event emission for agent workflows

It is a well-architected service with clear separation between the WebSocket gateway, MCP server, and event emitter—making it a solid foundation for future platform integrations.
