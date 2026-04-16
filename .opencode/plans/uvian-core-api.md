# Uvian Core API - Product Guide

## Overview

**Uvian Core API** is the central management service for the Uvian Agent Collaboration & Orchestration Platform. It provides RESTful APIs and MCP (Model Context Protocol) tools for managing core platform entities: accounts, agents, automation providers, identities, subscriptions, and external platforms.

### Position in Architecture

The Core API serves as the backbone of the Uvian platform, handling all critical entity management and providing the foundation upon which other services build. It sits at the center of the platform's service mesh.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Uvian Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ uvian-web    │    │ uvian-hub-api│    │ uvian-       │     │
│  │ (Frontend)   │    │ (API)        │    │ automation-  │     │
│  └──────────────┘    └──────────────┘    │ worker       │     │
│         │                   │            └──────────────┘     │
│         └───────────────────┼──────────────────┬──────────────┘  │
│                             │                  │                │
│                    ┌────────▼────────┐         │                │
│                    │  Uvian Core API │◄────────┘                │
│                    │  (Port 8002)    │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                    ┌────────▼────────┐    ┌──────────────┐     │
│                    │   Supabase      │    │    Redis     │     │
│                    │  (Database)     │    │  (Cache/Queue│     │
│                    └─────────────────┘    └──────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features & Capabilities

### 1. Account Management

Manages organizational accounts that group users and resources together.

**Capabilities:**
- Get account details
- List account members
- Get specific account members
- Get all accounts for a user

**Database Schema:**
```sql
-- accounts table
id             UUID PRIMARY KEY
name           VARCHAR
settings       JSONB
created_at     TIMESTAMP
updated_at     TIMESTAMP

-- account_members table  
id             UUID PRIMARY KEY
account_id     UUID (FK)
user_id        UUID (FK)
role           JSONB
created_at     TIMESTAMP
```

### 2. Agent Management

Creates and manages AI agents that can interact with the platform through MCP.

**Capabilities:**
- Create new agents with automatic API key generation
- List agents for an account
- Get specific agent details
- Delete agents

**Agent Provisioning Flow:**
```
User → Create Agent Request → Core API → Generate API Key → Return to User
                                                    ↓
                                          Store in agent_api_keys table
                                          (api_key_hash, api_key_prefix, service)
```

**Database Schema:**
```sql
-- Uses agent_api_keys table for authentication
id             UUID PRIMARY KEY
user_id        UUID (FK)
api_key_hash   VARCHAR (bcrypt hashed)
api_key_prefix VARCHAR(16) (for lookup)
is_active      BOOLEAN
service        VARCHAR (e.g., 'core-api')
created_at     TIMESTAMP
```

### 3. Automation Provider Configuration

Manages automation providers that agents use to perform tasks. Supports internal (built-in) and webhook-based external providers.

**Provider Types:**
- `internal` - Built-in providers for core functionality
- `webhook` - External HTTP endpoints for custom automation

**Authentication Methods:**
- `none` - No authentication
- `bearer` - Bearer token authentication
- `api_key` - API key authentication

**Capabilities:**
- Create/update/delete providers
- Link users to providers
- Unlink users from providers
- Get providers by account or user

**Database Schema:**
```sql
-- automaton_providers table
id              UUID PRIMARY KEY
account_id      UUID (FK)
owner_user_id   UUID (FK)
name            VARCHAR
type            VARCHAR ('internal' | 'webhook')
url             VARCHAR (nullable)
auth_method     VARCHAR (nullable)
auth_config     JSONB (nullable)
is_active       BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP

-- user_automation_providers table (user-provider links)
id                      UUID PRIMARY KEY
user_id                 UUID (FK)
automation_provider_id  UUID (FK)
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

### 4. Identity Linking

Links user identities across external platforms (WhatsApp, Slack, Telegram, Discord, Email).

**Supported Providers:**
- `whatsapp`
- `slack`
- `telegram`
- `discord`
- `email`

**Capabilities:**
- Create identities linked to external platform users
- Update identity metadata
- Delete identities
- Query identities by user, provider, or provider user ID

**Database Schema:**
```sql
-- user_identities table
id                UUID PRIMARY KEY
user_id           UUID (FK)
provider          VARCHAR
provider_user_id  VARCHAR
metadata          JSONB (nullable)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### 5. Subscriptions

Allows users to subscribe to platform resources for notifications or event-driven workflows.

**Subscribeable Resource Types:**
- `uvian.conversation` - Chat conversations
- `uvian.space` - Collaborative spaces
- `uvian.ticket` - Support tickets
- `uvian.job` - Background jobs
- `uvian.agent` - AI agents
- `uvian.intake` - Intake forms
- `uvian.submission` - Form submissions
- `discord.channel` - Discord channels

**Capabilities:**
- Create subscriptions to resources
- Delete subscriptions
- List user's subscriptions
- Get subscriptions by resource

**Database Schema:**
```sql
-- subscriptions table
id            UUID PRIMARY KEY
user_id       UUID (FK)
resource_type VARCHAR
resource_id   UUID
provider_id   VARCHAR
created_at    TIMESTAMP
```

### 6. External Platforms

Manages external platform configurations for connecting to messaging services.

**Supported Platforms:**
- `discord`
- `slack`
- `whatsapp`
- `telegram`
- `messenger`
- `email`

**Capabilities:**
- Create/update/delete platform configurations
- Get platform details
- List user's platforms

---

## User Value

### Why Users Care About Uvian Core API

1. **Unified Identity Management** - Connect multiple messaging platforms (WhatsApp, Slack, Discord) under one identity, enabling seamless communication across channels.

2. **Agent Orchestration** - Create and manage AI agents that can be provisioned with unique API keys, allowing them to autonomously interact with platform resources.

3. **Resource Subscriptions** - Subscribe to specific resources (conversations, tickets, jobs) to receive notifications or trigger automated workflows when events occur.

4. **Provider Configuration** - Configure automation providers (webhooks, internal services) that agents use to execute tasks, enabling complex automation scenarios.

5. **Access Control** - Account-based organization ensures proper access control and isolation between different teams or organizations.

### Key User Workflows

#### Workflow 1: Onboarding a New Agent
```
1. Create account (via accounts service)
2. Create agent → receives API key (sk_agent_xxx...)
3. Link automation providers to agent
4. Agent authenticates via MCP using API key
5. Agent can access platform resources
```

#### Workflow 2: Connecting External Identity
```
1. User authenticates with Core API
2. Create identity linking to external platform
   (e.g., provider: 'slack', provider_user_id: 'U123456')
3. Platform events can route to correct user identity
```

#### Workflow 3: Subscribing to Resources
```
1. User wants notifications for new tickets
2. POST /api/subscriptions with resource_type: 'uvian.ticket'
3. When new ticket created, subscription triggers notification
```

---

## Technical Architecture

### Framework & Key Libraries

| Category | Technology |
|----------|------------|
| HTTP Framework | Fastify 5.x |
| Database Client | @supabase/supabase-js |
| Cache/Queue | Redis (via ioredis) |
| Authentication | JWT (jsonwebtoken), bcrypt |
| MCP Server | @modelcontextprotocol/sdk |
| Validation | Zod |
| Auto-loading | @fastify/autoload |
| CORS | @fastify/cors |

### Service Layer Architecture

The application follows a layered architecture:

```
Routes → Commands → Services → Database
   ↓         ↓          ↓
 (MCP Tools)
```

**Services** (in `src/app/services/`):
- `accountService` - Account operations
- `agentService` - Agent CRUD + API key management
- `automationProviderService` - Provider management
- `subscriptionService` - Subscription management
- `identityService` - Identity management
- `externalPlatformService` - External platform config
- `apiKeyService` - API key lifecycle
- `queueService` - Event queue operations

Each service exposes two interfaces:
- `scoped()` - Operations with user context (permissions applied)
- `admin()` - Administrative operations (full access)

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Health** | | |
| GET | `/` | Root health check |
| GET | `/api/health` | API health check |
| **Accounts** | | |
| GET | `/api/accounts/:accountId/agents` | List agents in account |
| POST | `/api/accounts/:accountId/agents` | Create new agent |
| GET | `/api/accounts/:accountId/agents/:agentId` | Get agent details |
| DELETE | `/api/accounts/:accountId/agents/:agentId` | Delete agent |
| **Automation Providers** | | |
| GET | `/api/accounts/:accountId/automation-providers` | List providers |
| POST | `/api/accounts/:accountId/automation-providers` | Create provider |
| PUT | `/api/accounts/:accountId/automation-providers/:providerId` | Update provider |
| DELETE | `/api/accounts/:accountId/automation-providers/:providerId` | Delete provider |
| GET | `/api/users/:userId/automation-providers` | User's linked providers |
| POST | `/api/users/:userId/automation-providers` | Link provider to user |
| DELETE | `/api/users/:userId/automation-providers/:id` | Unlink provider |
| **Identities** | | |
| GET | `/api/identities` | List user's identities |
| GET | `/api/identities/:identityId` | Get identity details |
| POST | `/api/identities` | Create identity |
| PUT | `/api/identities/:identityId` | Update identity |
| DELETE | `/api/identities/:identityId` | Delete identity |
| **Subscriptions** | | |
| GET | `/api/subscriptions` | List user's subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| DELETE | `/api/subscriptions/:subscriptionId` | Delete subscription |
| **External Platforms** | | |
| GET | `/api/external-platforms` | List user's platforms |
| GET | `/api/external-platforms/:platformId` | Get platform details |
| POST | `/api/external-platforms` | Create platform |
| PUT | `/api/external-platforms/:platformId` | Update platform |
| DELETE | `/api/external-platforms/:platformId` | Delete platform |
| **Auth** | | |
| POST | `/api/auth/api-key` | Create API key |
| DELETE | `/api/auth/api-key` | Revoke API key |
| **MCP** | | |
| POST | `/v1/mcp` | MCP protocol endpoint |

### Authentication

The API supports two authentication methods:

1. **Bearer JWT** - Standard Supabase JWT tokens
2. **Agent API Key** - Prefix `sk_agent_` for machine-to-machine auth

All `/api/*` routes require authentication except `/api/health`.

### MCP Tools Exposed

The Core API exposes an MCP server with the following tools for agent interaction:

#### Account Tools
| Tool | Input | Description |
|------|-------|-------------|
| `get_account` | `{ accountId }` | Get account details |
| `list_account_members` | `{ accountId }` | List all members in account |
| `get_account_member` | `{ accountId, userId }` | Get specific member |
| `get_accounts_for_user` | `{}` | Get all accounts for authenticated user |

#### Provider Tools
| Tool | Input | Description |
|------|-------|-------------|
| `list_providers` | `{ accountId }` | List automation providers |
| `get_provider` | `{ providerId, accountId }` | Get provider details |
| `get_internal_provider` | `{ accountId }` | Get internal provider |
| `create_provider` | `{ accountId, name, type, url, auth_method, ... }` | Create provider |
| `update_provider` | `{ providerId, accountId, ... }` | Update provider |
| `delete_provider` | `{ providerId, accountId }` | Delete provider |

#### Subscription Tools
| Tool | Input | Description |
|------|-------|-------------|
| `list_subscriptions` | `{}` | List user's subscriptions |
| `get_subscription` | `{ subscriptionId }` | Get subscription details |
| `get_subscriptions_by_resource` | `{ resourceType, resourceId }` | Get by resource |
| `create_subscription` | `{ resourceType, resourceId, isActive }` | Create subscription |
| `delete_subscription` | `{ subscriptionId }` | Delete subscription |

#### Identity Tools
| Tool | Input | Description |
|------|-------|-------------|
| `list_identities` | `{}` | List user's identities |
| `get_identity` | `{ identityId }` | Get identity details |
| `get_identity_by_provider` | `{ provider, providerUserId }` | Lookup by provider |
| `create_identity` | `{ provider, providerUserId, metadata }` | Create identity |
| `update_identity` | `{ identityId, ... }` | Update identity |
| `delete_identity` | `{ identityId }` | Delete identity |

#### Agent Tools
| Tool | Input | Description |
|------|-------|-------------|
| `list_agents` | `{ accountId }` | List agents in account |
| `get_agent` | `{ accountId, agentId }` | Get agent details |
| `create_agent` | `{ accountId, name }` | Create new agent |
| `delete_agent` | `{ accountId, agentId }` | Delete agent |

#### User-Provider Link Tools
| Tool | Input | Description |
|------|-------|-------------|
| `list_user_automation_providers` | `{}` | User's linked providers |
| `get_user_automation_provider` | `{ providerId }` | Get link details |
| `link_user_automation_provider` | `{ automationProviderId }` | Link provider |
| `unlink_user_automation_provider` | `{ providerLinkId }` | Unlink provider |

---

## Events Emitted (CloudEvents)

The Core API emits CloudEvents for important domain events. Events are published via the event-emitter plugin.

### Event Types

| Event | Type | Data |
|-------|------|------|
| Automation Provider Created | `uvian.core.automation-provider.created` | `{ automationProviderId, accountId, name }` |
| Automation Provider Updated | `uvian.core.automation-provider.updated` | `{ automationProviderId, accountId }` |
| Automation Provider Deleted | `uvian.core.automation-provider.deleted` | `{ automationProviderId, accountId }` |
| Subscription Created | `uvian.core.subscription.created` | `{ subscriptionId, userId, resourceType, resourceId }` |
| Subscription Deleted | `uvian.core.subscription.deleted` | `{ subscriptionId, userId }` |
| Identity Created | `uvian.core.identity.created` | `{ identityId, userId, provider }` |
| Identity Updated | `uvian.core.identity.updated` | `{ identityId, userId }` |
| Identity Deleted | `uvian.core.identity.deleted` | `{ identityId, userId }` |
| MCP Provisioning Requested | `uvian.core.mcp-provisioning.requested` | `{ agentId, accountId, mcpType, mcpUrl, mcpName }` |

### Event Structure

```json
{
  "type": "uvian.core.automation-provider.created",
  "source": "/api/automation-providers",
  "data": {
    "automationProviderId": "uuid",
    "accountId": "uuid",
    "name": "My Provider"
  },
  "actorId": "user-uuid"
}
```

---

## Database Schema Summary

### Core Tables

| Table | Purpose |
|-------|---------|
| `accounts` | Organization/account records |
| `account_members` | User membership in accounts with roles |
| `automaton_providers` | Automation provider configurations |
| `user_automation_providers` | User-to-provider linkages |
| `user_identities` | External platform identity mappings |
| `subscriptions` | User resource subscriptions |
| `agent_api_keys` | Agent authentication keys |
| `external_platforms` | External messaging platform configs |

---

## Integration Points

### External Service Dependencies

| Service | Purpose | Connection |
|---------|---------|------------|
| **Supabase** | Database & Auth | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_ANON_KEY` |
| **Redis** | Caching & Queue | `REDIS_URL` |
| **JWT** | Token verification | `SUPABASE_JWT_SECRET` |

### Internal Service Calls

The Core API uses shared service packages:
- `@org/services-accounts` - Account operations
- `@org/services-api-key` - API key management
- `@org/services-identity` - Identity operations
- `@org/services-subscription` - Subscription operations
- `@org/services-queue` - Event queue operations
- `@org/plugins-event-emitter` - CloudEvents emission

### Event Consumption

The Core API currently **produces** events rather than consuming them. Other services (like uvian-automation-worker) subscribe to Core events to trigger downstream actions.

---

## Agent Provisioning

Agents are provisioned through the following flow:

```
1. Client POSTs to /api/accounts/:accountId/agents with { name }
2. Core API creates agent record
3. Core API generates API key via apiKeyService
4. API key stored with prefix for lookup (bcrypt hashed)
5. Agent receives: { id, userId, accountId, name, email, apiKey, createdAt }
6. Agent uses API key (prefix 'sk_agent_') to authenticate via MCP
```

**MCP Authentication for Agents:**
- Agent sends API key in Authorization header: `Bearer sk_agent_xxxx...`
- Core API validates key against `agent_api_keys` table
- On success, issues JWT for MCP session
- JWT cached for 50 minutes to reduce DB load

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HOST` | No | Server host (default: localhost) |
| `PORT` | No | Server port (default: 8002) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `SUPABASE_JWT_SECRET` | Yes | JWT verification secret |
| `REDIS_URL` | Yes | Redis connection string |
| `SECRET_INTERNAL_API_KEY` | Yes | Internal API authentication |

---

## Running the Service

```bash
# Development
npx nx serve uvian-core-api

# Production build
npx nx build uvian-core-api
```

**Default Port:** 8002

---

## Summary

Uvian Core API is the central management hub for the Uvian platform. It provides:

- **RESTful APIs** for all core entity management
- **MCP tools** enabling agents to programmatically interact with the platform
- **CloudEvents** for event-driven architectures
- **Authentication** via JWT and agent API keys
- **Service layer** pattern with scoped and admin interfaces

The API serves as the foundation upon which other platform services (automation, scheduling, intake, etc.) build their functionality, making it critical to the overall platform architecture.
