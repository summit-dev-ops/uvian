# Uvian Platform Guide

Comprehensive documentation for the Uvian platform - an AI-powered collaboration and automation platform built as an Nx monorepo.

---

## Platform Overview

Uvian is a microservices-based platform that provides real-time chat, collaborative workspaces, AI agent automation, Discord integration, scheduled tasks, and ephemeral intake forms. The platform is organized as an **Nx monorepo with npm workspaces**, containing 10 applications and shared packages.

### Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  uvian-web  │────▶│ uvian-hub-api│────▶│   Supabase DB   │
│  (Next.js)  │◀────│  (Fastify)   │◀────│   (PostgreSQL)  │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐     ┌──────────────────┐
                    │    Redis     │◀───▶│ uvian-event-worker│
                    │  (Queue/Pub) │     │  (BullMQ consumer)│
                    └──────┬───────┘     └─────────┬────────┘
                           │                       │
              ┌────────────┼────────────┐          │
              ▼            ▼            ▼          ▼
┌─────────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐
│uvian-core-api   │ │uvian-      │ │uvian-    │ │uvian-automation- │
│(Agent mgmt)     │ │discord-    │ │scheduler-│ │worker (LangGraph)│
│                 │ │connector   │ │api       │ │                  │
└────────┬────────┘ └─────┬──────┘ └────┬─────┘ └────────┬─────────┘
         │                │             │                 │
         ▼                ▼             ▼                 ▼
┌─────────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────────┐
│uvian-automation │ │uvian-      │ │          │ │                  │
│api (Agent config│ │intake-api  │ │          │ │                  │
│+ jobs + MCP)    │ │(Intake     │ │          │ │                  │
│                 │ │ forms)     │ │          │ │                  │
└────────┬────────┘ └─────┬──────┘ └──────────┘ └──────────────────┘
         │                │
         ▼                ▼
┌─────────────────┐ ┌────────────┐
│uvian-intake-web │ │            │
│(Form renderer)  │ │            │
└─────────────────┘ └────────────┘
```

### Shared Infrastructure

| Component        | Purpose                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| **Supabase**     | PostgreSQL database with Row Level Security, Auth, and real-time subscriptions |
| **Redis**        | Job queues (BullMQ), pub/sub messaging, distributed locking, caching           |
| **MCP Protocol** | Model Context Protocol - standardized AI agent tool access across all services |
| **CloudEvents**  | Standardized event format (`com.uvian.*`) for cross-service communication      |

### Workspace Packages

| Package             | Purpose                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `@org/ui`           | Shared shadcn/ui component library (used by uvian-web, uvian-intake-web)                    |
| `@org/uvian-events` | Typed CloudEvent definitions and envelope types                                             |
| `@org/services-*`   | Shared service factories (api-key, accounts, queue, secrets, identity, subscription, users) |
| `@org/utils-*`      | Shared utilities (encryption, cache)                                                        |
| `@org/plugins-*`    | Shared Fastify plugins (event-emitter)                                                      |

---

## Applications

### Frontend Applications

| App                                                 | Framework  | Port | Purpose                                         |
| --------------------------------------------------- | ---------- | ---- | ----------------------------------------------- |
| [uvian-web](apps/uvian-web/README.md)               | Next.js 16 | 3000 | Main web app - chat, spaces, accounts, settings |
| [uvian-intake-web](apps/uvian-intake-web/README.md) | Next.js    | -    | Public intake form renderer                     |

### Backend APIs

| App                                                               | Framework            | Port | Purpose                                                                  |
| ----------------------------------------------------------------- | -------------------- | ---- | ------------------------------------------------------------------------ |
| [uvian-hub-api](apps/uvian-hub-api/README.md)                     | Fastify              | 8000 | Central hub - chat, spaces, notes, posts, assets, profiles               |
| [uvian-core-api](apps/uvian-core-api/README.md)                   | Fastify              | 8002 | Core management - accounts, agents, providers, identities, subscriptions |
| [uvian-automation-api](apps/uvian-automation-api/README.md)       | Fastify              | 3001 | Agent automation - jobs, LLMs, MCPs, skills, webhooks                    |
| [uvian-intake-api](apps/uvian-intake-api/README.md)               | Fastify              | 8001 | Intake forms - ephemeral forms with E2E encryption                       |
| [uvian-scheduler-api](apps/uvian-scheduler-api/README.md)         | Fastify              | 3003 | Scheduling - cron-based task scheduling                                  |
| [uvian-discord-connector](apps/uvian-discord-connector/README.md) | Fastify + discord.js | 3003 | Discord bridge - WebSocket gateway + MCP server                          |

### Workers

| App                                                               | Language   | Purpose                                                         |
| ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| [uvian-event-worker](apps/uvian-event-worker/README.md)           | TypeScript | Event distribution - routes CloudEvents to subscribed providers |
| [uvian-automation-worker](apps/uvian-automation-worker/README.md) | Python     | AI agent worker - LangGraph-powered job processing              |

---

## Authentication Architecture

The platform uses a multi-tier authentication model:

### User Authentication

- **Supabase Auth** (email/password) with email verification
- JWT tokens passed as `Authorization: Bearer <token>`
- Middleware (`proxy.ts` in uvian-web) handles route protection

### Service-to-Service Authentication

- **Internal API Key** - `x-api-key` header matching `SECRET_INTERNAL_API_KEY`
- Used between microservices for internal endpoints

### Agent Authentication (MCP)

- **Agent API Keys** - `sk_agent_*` prefixed keys stored in `agent_api_keys` table
- bcrypt-hashed with JWT caching (50-min TTL) to avoid repeated comparisons
- Agents can also use pre-issued Supabase JWTs

### API Key Management

- Users create scoped API keys via `/api/auth/api-key` endpoints
- Keys are scoped to specific services (e.g., `automation-api`, `intake-api`, `discord`)
- Account membership checks enforced for non-internal requests

---

## Event Architecture

### CloudEvents Format

All platform events follow the CloudEvents spec v1.0:

```json
{
  "specversion": "1.0",
  "type": "com.uvian.message.created",
  "source": "/conversations/conv_abc123",
  "id": "evt_xyz789",
  "time": "2026-04-06T12:00:00Z",
  "datacontenttype": "application/json",
  "subject": "msg_def456",
  "data": { ... }
}
```

### Event Flow

```
1. Service mutation (e.g., create message)
    │
2. Route handler emits domain event via eventEmitter
    │
3. Event serialized as CloudEvent → pushed to BullMQ queue
    │
4. uvian-event-worker consumes from queue
    │
5. EventRouter looks up subscribed providers for the resource
    │
6. Routes event to each provider in parallel:
   - Internal: POST to automation-api webhook endpoint
   - External: POST to provider's configured URL
    │
7. uvian-automation-worker picks up job from queue
    │
8. LangGraph agent processes event with MCP tools + skills
    │
9. Results streamed back via Redis pub/sub → WebSocket
```

### Event Domains

| Domain    | Events                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| Messaging | message.created, message.updated, message.deleted, conversation.\*                   |
| Spaces    | space.created, space.updated, space.deleted, space.member\_\*                        |
| Content   | post.created, note.updated, asset.uploaded                                           |
| Jobs      | job.created, job.completed, job.failed, job.cancelled, job.retry                     |
| Tickets   | ticket.created, ticket.updated, ticket.deleted                                       |
| Users     | user.created, user.updated, user.deleted                                             |
| Accounts  | account.created, account.member_joined, account.member_role_changed                  |
| Agents    | agent.created, agent.updated, agent.deleted                                          |
| Intake    | intake.created, intake.completed, intake.revoked                                     |
| Core      | provider.created, subscription.created, identity.created, mcp.provisioning_requested |
| Discord   | discord.message_created, discord.interaction_received                                |
| Schedules | schedule.created, schedule.fired, schedule.completed                                 |

---

## MCP (Model Context Protocol) Integration

Every major service exposes an MCP server at `POST /v1/mcp`, enabling AI agents to interact with platform resources programmatically.

| Service                 | MCP Tools | Purpose                                                     |
| ----------------------- | --------- | ----------------------------------------------------------- |
| uvian-core-api          | 24+       | Account, provider, subscription, identity, agent management |
| uvian-automation-api    | 27        | Secrets, agent config, LLMs, MCPs, skills management        |
| uvian-intake-api        | 12        | Intake forms, submissions, secrets, decryption              |
| uvian-discord-connector | 13        | Discord messaging, channel/guild info, reactions            |
| uvian-scheduler-api     | 7         | Schedule CRUD, pause/resume/cancel                          |

### MCP Auth Flow

```
Agent sends request with Bearer sk_agent_* key
    │
1. Extract first 16 chars as prefix
2. Check JWT cache (50-min TTL)
3. If cache miss: lookup in agent_api_keys table
4. bcrypt.compare(apiKey, storedHash)
5. Mint Supabase JWT with user's sub
6. Cache JWT with prefix key
7. Create MCP server scoped to user
```

---

## Database Schema

### Supabase Schemas

| Schema            | Purpose                                                        | Managed By                                    |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `public`          | Core tables (secrets, agent_api_keys)                          | uvian-automation-api                          |
| `core_automation` | Agents, jobs, mcps, llms, skills, checkpoints, process_threads | uvian-automation-api, uvian-automation-worker |
| `core_intake`     | Intakes, submissions                                           | uvian-intake-api                              |
| `core_scheduler`  | Schedules                                                      | uvian-scheduler-api                           |

### Key Tables

| Table                       | Schema          | Purpose                      |
| --------------------------- | --------------- | ---------------------------- |
| `accounts`                  | public          | Account/team management      |
| `account_members`           | public          | Account membership           |
| `automaton_providers`       | public          | Automation providers         |
| `subscriptions`             | public          | Event subscriptions          |
| `user_identities`           | public          | External platform identities |
| `user_automation_providers` | public          | User-provider links          |
| `agent_api_keys`            | public          | Agent API key storage        |
| `secrets`                   | public          | Encrypted secrets            |
| `external_platforms`        | public          | Platform integrations        |
| `agents`                    | core_automation | AI agent records             |
| `jobs`                      | core_automation | Automation job queue         |
| `mcps`                      | core_automation | MCP server configurations    |
| `llms`                      | core_automation | LLM provider configurations  |
| `skills`                    | core_automation | Agent skill definitions      |
| `agent_mcps`                | core_automation | Agent-MCP links              |
| `agent_llms`                | core_automation | Agent-LLM links              |
| `agent_skills`              | core_automation | Agent-skill links            |
| `agent_checkpoints`         | core_automation | LangGraph state persistence  |
| `process_threads`           | core_automation | Agent conversation threads   |
| `intakes`                   | core_intake     | Intake form definitions      |
| `submissions`               | core_intake     | Intake form submissions      |
| `schedules`                 | core_scheduler  | Scheduled tasks              |

---

## Development

### Prerequisites

- **Node.js** (version specified in workspace)
- **Python 3.14.2** (for uvian-automation-worker)
- **Poetry** (Python package manager)
- **Redis** (local instance for queues and pub/sub)
- **Supabase** project (local or cloud)

### Workspace Structure

```
uvian/
├── apps/                          # 10 applications
│   ├── uvian-web/                 # Main Next.js frontend
│   ├── uvian-intake-web/          # Intake form Next.js frontend
│   ├── uvian-hub-api/             # Central hub Fastify API
│   ├── uvian-core-api/            # Core management Fastify API
│   ├── uvian-automation-api/      # Automation Fastify API
│   ├── uvian-intake-api/          # Intake Fastify API
│   ├── uvian-scheduler-api/       # Scheduler Fastify API
│   ├── uvian-discord-connector/   # Discord bridge Fastify API
│   ├── uvian-event-worker/        # Event distribution worker
│   └── uvian-automation-worker/   # AI agent Python worker
├── packages/
│   ├── ui/                        # Shared UI component library
│   └── uvian-events/              # Shared event type definitions
└── AGENTS.md                      # AI agent guidelines
```

### Common Commands

```bash
# Build all
npx nx run-many -t build

# Build specific app
npx nx build <project>

# Serve apps (development)
npx nx run-many -t serve -p=uvian-hub-api,uvian-web,uvian-automation-worker

# Serve specific app
npx nx serve uvian-web
npx nx serve uvian-hub-api

# Test all
npx nx test <project>

# Test single file
npx nx test <project> --testPathPattern=filename.spec.ts

# Lint
npx nx lint <project>

# Typecheck
npx nx typecheck <project>

# Python worker
cd apps/uvian-automation-worker
poetry install --with dev
poetry run pytest tests/
```

### Code Conventions

- **TypeScript**: strict mode, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`
- **Prettier**: Single quotes, no semicolons (ASI)
- **ESLint**: Flat config, extends `nx.configs['flat/*']`
- **Imports**: `@org/*` for workspace packages, `~/*` for path aliases
- **Naming**: kebab-case files, PascalCase components, camelCase variables

---

## Deployment

All services are deployed on **Railway** with consistent configuration:

| Setting              | Production   | Staging  |
| -------------------- | ------------ | -------- |
| Restart policy       | `on_failure` | `always` |
| Health check timeout | 30-60s       | 30-60s   |

### Port Map

| Service                 | Port      |
| ----------------------- | --------- |
| uvian-web               | 3000      |
| uvian-hub-api           | 8000      |
| uvian-intake-api        | 8001      |
| uvian-core-api          | 8002      |
| uvian-automation-api    | 3001      |
| uvian-discord-connector | 3003      |
| uvian-scheduler-api     | 3003      |
| uvian-intake-web        | (dynamic) |

### Shared Environment Variables

These variables are needed across multiple services:

| Variable                  | Used By                         |
| ------------------------- | ------------------------------- |
| `SUPABASE_URL`            | All services                    |
| `SUPABASE_SECRET_KEY`     | All backend services            |
| `SUPABASE_ANON_KEY`       | All backend services            |
| `SUPABASE_JWT_SECRET`     | All services with auth          |
| `SECRET_INTERNAL_API_KEY` | All services with internal auth |
| `REDIS_HOST`              | All services with queue/cache   |
| `REDIS_PORT`              | All services with queue/cache   |
| `REDIS_PASSWORD`          | All services with Redis auth    |

---

## Service Dependencies

```
uvian-web
  └── uvian-hub-api (chat, spaces, profiles)
  └── uvian-core-api (accounts, agents)

uvian-intake-web
  └── uvian-intake-api (form schema, submission)

uvian-hub-api
  └── uvian-automation-api (job creation, webhook events)
  └── uvian-event-worker (event distribution)

uvian-core-api
  └── uvian-event-worker (identity, subscription, provider events)

uvian-automation-api
  └── uvian-automation-worker (job processing)
  └── uvian-event-worker (webhook event routing)

uvian-discord-connector
  └── uvian-intake-api (account linking via /link command)
  └── uvian-event-worker (message/interaction events)
  └── uvian-automation-worker (MCP provisioning)

uvian-scheduler-api
  └── uvian-event-worker (schedule.fired events)

uvian-event-worker
  └── uvian-automation-api (internal provider routing)

uvian-automation-worker
  └── uvian-automation-api (fetch agent secrets, skills, MCP configs)
```

---

## Quick Reference

### Creating a New Agent

1. Call `POST /api/agents/init` on uvian-automation-api (internal auth)
2. Agent record created in `core_automation.agents`
3. Hub MCP connection established
4. Default MCP connections configured for all platform services
5. Agent receives `sk_agent_*` API key for MCP access

### Creating an Intake Form

1. Call `POST /api/intakes` on uvian-intake-api (internal auth)
2. Intake record created with RSA public key and JSON schema
3. URL generated: `{INTAKE_BASE_URL}/t/{tokenId}`
4. User opens URL in uvian-intake-web
5. Form rendered dynamically from schema
6. Submission stored with optional E2E encryption

### Connecting Discord

1. User runs `/link` in Discord
2. Bot creates intake form via intake-api with RSA keypair
3. User fills form, linking Discord identity to Uvian account
4. User runs `/activate agent:<name>` to provision agent
5. `MCP_PROVISIONING_REQUESTED` event emitted
6. Automation worker connects agent to Discord MCP endpoint

### Scheduling a Task

1. Call `POST /api/schedules` on uvian-scheduler-api
2. Schedule stored with cron expression and event data
3. Cron sync loop checks for due schedules every N minutes
4. Redis distributed lock prevents duplicate processing
5. `SCHEDULE_FIRED` CloudEvent enqueued in BullMQ
6. Event worker routes to subscribed providers

---

## Notable Patterns

| Pattern                      | Description                                                    | Used In                 |
| ---------------------------- | -------------------------------------------------------------- | ----------------------- |
| **Plugin-based Fastify**     | Auto-load plugins/routes via `@fastify/autoload`               | All Fastify APIs        |
| **Scoped vs Admin Services** | `.scoped()` (user-permission-checked) vs `.admin()` (elevated) | All backend services    |
| **Service Factory**          | Centralized service instantiation with DI                      | All backend services    |
| **Trigger Registry**         | Decorator-based event-to-message registration                  | uvian-automation-worker |
| **Proxy-based Caching**      | Transparent Redis caching via JS Proxy                         | uvian-event-worker      |
| **Agent-as-User**            | Agents created as Supabase Auth users                          | uvian-core-api          |
| **MCP Key + JWT Cache**      | bcrypt verification with 50-min JWT cache                      | All MCP servers         |
| **E2E Encryption**           | RSA public key per intake, hybrid encryption                   | uvian-intake-api        |
| **Distributed Locking**      | Redis-based lock for cron sync coordination                    | uvian-scheduler-api     |
| **Domain-Driven Frontend**   | `lib/domains/[domain]/` + `components/features/[feature]/`     | uvian-web               |
| **Page Layout System**       | Consistent PageWrapper > PageContainer composition             | uvian-web               |
| **BaseAction Pattern**       | Typed action system with guards and execution                  | uvian-web               |
