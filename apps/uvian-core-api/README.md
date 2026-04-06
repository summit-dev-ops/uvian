# uvian-core-api

Core platform management API for the Uvian platform. Manages accounts, agents (AI/bot users), automation providers, external platform integrations, user identities, and event subscriptions. Exposes an MCP server for AI agent tool access.

## Tech Stack

| Technology                     | Purpose                               |
| ------------------------------ | ------------------------------------- |
| **Fastify**                    | HTTP framework                        |
| **TypeScript**                 | Type safety                           |
| **Supabase**                   | PostgreSQL database + auth            |
| **Redis**                      | Caching + event queue                 |
| **MCP SDK**                    | Model Context Protocol server         |
| **Zod**                        | Runtime validation                    |
| **bcryptjs**                   | API key hashing                       |
| **jsonwebtoken**               | JWT signing/verification              |
| **@org/uvian-events**          | Typed domain events                   |
| **@org/plugins-event-emitter** | Event emission with queue integration |

## Directory Structure

```
apps/uvian-core-api/
├── src/
│   ├── main.ts                          # Entry point (port 8002)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── clients/
│       │   ├── redis.ts                 # Redis connection singleton
│       │   └── supabase.client.ts       # Supabase admin/anon/user clients
│       ├── plugins/
│       │   ├── auth.plugin.ts           # JWT auth (authenticate, authenticateOptional)
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   ├── event-emitter.ts         # Domain event emitter
│       │   └── mcp.plugin.ts            # MCP server (24+ tools for platform management)
│       ├── routes/
│       │   ├── health.routes.ts           # GET /, GET /api/health
│       │   ├── auth.routes.ts             # POST/DELETE /api/auth/api-key
│       │   ├── accounts.routes.ts         # CRUD /api/accounts/:accountId/agents
│       │   ├── identities.routes.ts       # CRUD /api/identities
│       │   ├── subscriptions.routes.ts    # CRUD /api/subscriptions
│       │   ├── external-platforms.routes.ts # CRUD /api/external-platforms
│       │   └── automation-providers.routes.ts # CRUD + user linking
│       └── services/
│           ├── factory.ts               # Service factory
│           ├── index.ts                 # Re-exports
│           ├── types/
│           │   └── service-clients.ts   # ServiceClients interface
│           ├── agent/                   # Agent lifecycle management
│           ├── automation-provider/     # Provider CRUD + user linking
│           └── external-platform/       # Platform integration management
└── package.json
```

## Environment Variables

| Variable                  | Purpose                             | Default     |
| ------------------------- | ----------------------------------- | ----------- |
| `HOST`                    | Server bind address                 | `localhost` |
| `PORT`                    | Server port                         | `8002`      |
| `SUPABASE_URL`            | Supabase project URL                | (required)  |
| `SUPABASE_SECRET_KEY`     | Supabase service role key           | (required)  |
| `SUPABASE_ANON_KEY`       | Supabase anon key                   | (required)  |
| `SUPABASE_JWT_SECRET`     | JWT signing/verification secret     | (required)  |
| `SECRET_INTERNAL_API_KEY` | Internal service-to-service API key | (required)  |
| `REDIS_HOST`              | Redis host                          | `localhost` |
| `REDIS_PORT`              | Redis port                          | `6379`      |
| `REDIS_FAMILY`            | Redis IP family                     | `0`         |

## API Endpoints

### Health

| Method | Path          | Description  |
| ------ | ------------- | ------------ |
| GET    | `/`           | Health check |
| GET    | `/api/health` | Health check |

### Auth / API Keys

| Method | Path                | Auth          | Description    |
| ------ | ------------------- | ------------- | -------------- |
| POST   | `/api/auth/api-key` | Internal/User | Create API key |
| DELETE | `/api/auth/api-key` | Internal/User | Revoke API key |

### Accounts & Agents

| Method | Path                                       | Auth | Description  |
| ------ | ------------------------------------------ | ---- | ------------ |
| GET    | `/api/accounts/:accountId/agents`          | User | List agents  |
| POST   | `/api/accounts/:accountId/agents`          | User | Create agent |
| GET    | `/api/accounts/:accountId/agents/:agentId` | User | Get agent    |
| DELETE | `/api/accounts/:accountId/agents/:agentId` | User | Delete agent |

### Identities

| Method | Path                          | Auth | Description                                                 |
| ------ | ----------------------------- | ---- | ----------------------------------------------------------- |
| GET    | `/api/identities`             | User | List identities                                             |
| GET    | `/api/identities/:identityId` | User | Get identity                                                |
| POST   | `/api/identities`             | User | Create identity (whatsapp, slack, telegram, discord, email) |
| PUT    | `/api/identities/:identityId` | User | Update identity                                             |
| DELETE | `/api/identities/:identityId` | User | Delete identity                                             |

### Subscriptions

| Method | Path                                 | Auth | Description         |
| ------ | ------------------------------------ | ---- | ------------------- |
| GET    | `/api/subscriptions`                 | User | List subscriptions  |
| POST   | `/api/subscriptions`                 | User | Create subscription |
| DELETE | `/api/subscriptions/:subscriptionId` | User | Delete subscription |

### External Platforms

| Method | Path                                  | Auth | Description     |
| ------ | ------------------------------------- | ---- | --------------- |
| GET    | `/api/external-platforms`             | User | List platforms  |
| GET    | `/api/external-platforms/:platformId` | User | Get platform    |
| POST   | `/api/external-platforms`             | User | Create platform |
| PUT    | `/api/external-platforms/:platformId` | User | Update platform |
| DELETE | `/api/external-platforms/:platformId` | User | Delete platform |

### Automation Providers

| Method | Path                                                | Auth | Description               |
| ------ | --------------------------------------------------- | ---- | ------------------------- |
| GET    | `/api/accounts/:accountId/automation-providers`     | User | List providers            |
| POST   | `/api/accounts/:accountId/automation-providers`     | User | Create provider           |
| PUT    | `/api/accounts/:accountId/automation-providers/:id` | User | Update provider           |
| DELETE | `/api/accounts/:accountId/automation-providers/:id` | User | Delete provider           |
| GET    | `/api/users/:userId/automation-providers`           | User | List user's providers     |
| POST   | `/api/users/:userId/automation-providers`           | User | Link user to provider     |
| DELETE | `/api/users/:userId/automation-providers/:id`       | User | Unlink user from provider |

### MCP

| Method | Path      | Auth                | Description            |
| ------ | --------- | ------------------- | ---------------------- |
| POST   | `/v1/mcp` | Bearer `sk_agent_*` | MCP server (24+ tools) |
| GET    | `/v1/mcp` | None                | Returns 405            |

## Architecture

- **Plugin-based Fastify** with `@fastify/autoload`
- **Scoped vs Admin service pattern** - every service exposes `.scoped()` (user-permission-checked) and `.admin()` (elevated) access
- **Dual Supabase client pattern** - admin (bypasses RLS) and user-scoped (respects RLS)
- **MCP API key auth** with bcrypt verification and JWT caching (50-min TTL)
- **Agent-as-User pattern** - agents created as Supabase Auth users with `@uvian.internal` emails
- **Event-driven** - emits domain events after mutations via Redis-backed queue

## Commands

```bash
# Build
npx nx build uvian-core-api

# Serve (development)
npx nx serve uvian-core-api

# Test
npx nx test uvian-core-api

# Lint
npx nx lint uvian-core-api
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx start uvian-core-api --configuration=production`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-core-api/**`, `packages/uvian-events/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
