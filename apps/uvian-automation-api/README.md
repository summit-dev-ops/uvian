# uvian-automation-api

AI Agent Automation Management API for the Uvian platform. Manages agent lifecycle, job queue orchestration, LLM/MCP/skill configurations, and webhook event ingestion for AI-powered automation workflows.

## Tech Stack

| Technology                | Purpose                       |
| ------------------------- | ----------------------------- |
| **Fastify**               | HTTP framework                |
| **TypeScript**            | Type safety                   |
| **BullMQ**                | Job queue (Redis-backed)      |
| **Redis**                 | Queue backend                 |
| **Supabase**              | PostgreSQL database           |
| **MCP SDK**               | Model Context Protocol server |
| **Zod**                   | Runtime validation            |
| **bcryptjs**              | API key hashing               |
| **jsonwebtoken**          | JWT verification              |
| **@org/utils-encryption** | RSA/AES encryption            |

## Directory Structure

```
apps/uvian-automation-api/
├── src/
│   ├── main.ts                          # Entry point (port 3001)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── clients/
│       │   ├── redis.ts                 # Redis connection singleton
│       │   └── supabase.client.ts       # Supabase admin/anon/user clients
│       ├── plugins/
│       │   ├── auth.plugin.ts           # JWT auth (authenticate, authenticateOptional)
│       │   ├── bullmq.ts                # BullMQ queue service decoration
│       │   ├── event-handlers.ts        # Domain event handler registration
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   ├── mcp.plugin.ts            # MCP server (27 tools for secrets, agents, LLMs, MCPs, skills)
│       │   ├── sensible.ts              # Error handling plugin
│       │   └── webhook-auth.ts          # Webhook signature authentication
│       ├── routes/
│       │   ├── agent-bootstrap.routes.ts  # Agent bootstrapping endpoints
│       │   ├── agent-config.routes.ts     # Agent configuration CRUD
│       │   ├── agent-llms.routes.ts       # Agent LLM linking/unlinking
│       │   ├── agent-mcps.routes.ts       # Agent MCP linking/unlinking
│       │   ├── agent-skills.routes.ts     # Agent skill linking/unlinking
│       │   ├── agents.routes.ts           # Agent initialization (POST /api/agents/init)
│       │   ├── auth.routes.ts             # API key management
│       │   ├── health.routes.ts           # GET /api/health
│       │   ├── jobs.ts                    # Job CRUD (create, list, get, cancel, retry, delete)
│       │   ├── llms.routes.ts             # LLM provider management
│       │   ├── mcps.routes.ts             # MCP server management
│       │   ├── secrets.routes.ts          # Secrets management
│       │   ├── skills.routes.ts           # Skill management
│       │   ├── tickets.ts                 # Ticket management
│       │   └── webhooks.ts               # POST /api/webhooks/agents/:agentId/events
│       ├── services/
│       │   ├── factory.ts                # Service factory (apiKey, account, queue, secrets)
│       │   ├── index.ts                  # Re-exports all services
│       │   ├── webhook-handler.service.ts # Webhook event processing
│       │   ├── agent-bootstrap/          # Agent bootstrapping logic
│       │   ├── agent-config/             # Agent configuration CRUD
│       │   ├── event-handlers/           # Domain event handlers
│       │   ├── job/                      # Job lifecycle management
│       │   ├── llm/                      # LLM provider management
│       │   ├── mcp/                      # MCP server management
│       │   ├── skill/                    # Skill management
│       │   └── ticket/                   # Ticket management
│       └── types/                        # TypeScript type definitions
└── package.json
```

## Environment Variables

| Variable                   | Purpose                                | Default     |
| -------------------------- | -------------------------------------- | ----------- |
| `HOST`                     | Server bind address                    | `localhost` |
| `PORT`                     | Server port                            | `3001`      |
| `FRONTEND_URL`             | CORS origin                            | `*`         |
| `SUPABASE_URL`             | Supabase project URL                   | (required)  |
| `SUPABASE_SECRET_KEY`      | Supabase service role key              | (required)  |
| `SUPABASE_ANON_KEY`        | Supabase anon key                      | (required)  |
| `SUPABASE_JWT_SECRET`      | JWT signing/verification secret        | (required)  |
| `REDIS_HOST`               | Redis host                             | `localhost` |
| `REDIS_PORT`               | Redis port                             | `6379`      |
| `SECRET_WEBHOOK_API_KEY`   | Webhook authentication key             | (required)  |
| `SECRET_INTERNAL_API_KEY`  | Internal service auth + encryption key | (required)  |
| `UVIAN_CORE_API_URL`       | Core API URL for MCP config            | (optional)  |
| `UVIAN_HUB_API_URL`        | Hub API URL for MCP config             | (optional)  |
| `UVIAN_SCHEDULER_API_URL`  | Scheduler API URL for MCP config       | (optional)  |
| `UVIAN_AUTOMATION_API_URL` | Self-referential URL for MCP config    | (optional)  |
| `UVIAN_INTAKE_API_URL`     | Intake API URL for MCP config          | (optional)  |

## API Endpoints

### Health

| Method | Path                   | Auth | Description          |
| ------ | ---------------------- | ---- | -------------------- |
| GET    | `/api/health`          | None | Health check         |
| GET    | `/api/webhooks/health` | None | Webhook health check |

### Agents

| Method | Path               | Auth     | Description                           |
| ------ | ------------------ | -------- | ------------------------------------- |
| POST   | `/api/agents/init` | Internal | Initialize agent with MCP connections |

### Jobs

| Method | Path                   | Auth | Description                        |
| ------ | ---------------------- | ---- | ---------------------------------- |
| POST   | `/api/jobs`            | User | Create a new job                   |
| GET    | `/api/jobs`            | User | List jobs (filter by status, type) |
| GET    | `/api/jobs/usage`      | User | Get job usage stats                |
| GET    | `/api/jobs/:id`        | User | Get job details                    |
| PATCH  | `/api/jobs/:id/cancel` | User | Cancel a job                       |
| PATCH  | `/api/jobs/:id/retry`  | User | Retry a failed job                 |
| DELETE | `/api/jobs/:id`        | User | Delete a job                       |

### Webhooks

| Method | Path                                   | Auth    | Description                         |
| ------ | -------------------------------------- | ------- | ----------------------------------- |
| POST   | `/api/webhooks/agents/:agentId/events` | Webhook | Receive events for agent processing |

### MCP

| Method | Path      | Auth                | Description           |
| ------ | --------- | ------------------- | --------------------- |
| POST   | `/v1/mcp` | Bearer `sk_agent_*` | MCP server (27 tools) |
| GET    | `/v1/mcp` | None                | Returns 405           |

### MCP Tools (27 total)

`generate_rsa_keypair`, `get_secret`, `list_secrets`, `delete_secret`, `decrypt_data`, `create_agent_config`, `get_agent_config`, `update_agent_config`, `list_llms`, `get_llm`, `create_llm`, `list_mcps`, `get_mcp`, `create_mcp`, `link_llm`, `unlink_llm`, `link_mcp`, `unlink_mcp`, `get_agent_llms`, `get_agent_mcps`, `create_skill`, `list_skills`, `get_skill`, `update_skill`, `delete_skill`, `link_skill`, `unlink_skill`, `get_agent_skills`

### Auth

| Method | Path                | Auth          | Description    |
| ------ | ------------------- | ------------- | -------------- |
| POST   | `/api/auth/api-key` | Internal/User | Create API key |
| DELETE | `/api/auth/api-key` | Internal/User | Revoke API key |

## Architecture

- **Plugin-based Fastify** with `@fastify/autoload` for auto-registration
- **BullMQ queue** for job management (Redis-backed)
- **MCP server** providing 27 tools for AI agent self-configuration (secrets, LLMs, MCPs, skills)
- **Webhook ingestion** endpoint for event-driven job creation
- **API key authentication** with bcrypt hashing and JWT caching (50-min TTL)
- **RSA encryption** for secure secret storage and data decryption
- **Agent initialization** (`/api/agents/init`) creates agents with default MCP connections to all platform services

## Commands

```bash
# Build
npx nx build @org/uvian-automation-api

# Serve (development)
npx nx serve @org/uvian-automation-api

# Serve (production)
npx nx run @org/uvian-automation-api:serve:production

# Test
npx nx test @org/uvian-automation-api

# Lint
npx nx lint @org/uvian-automation-api
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-automation-api:serve:production`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-automation-api/**`, `packages/uvian-events/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
