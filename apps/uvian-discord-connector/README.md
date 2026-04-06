# uvian-discord-connector

Discord bridge/integration service for the Uvian platform. Connects to Discord via WebSocket (discord.js), emits events into the platform event system, and exposes an MCP server so AI agents can read and interact with Discord.

## Tech Stack

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| **Fastify**               | HTTP framework                  |
| **TypeScript**            | Type safety                     |
| **discord.js**            | Discord WebSocket gateway (v14) |
| **MCP SDK**               | Model Context Protocol server   |
| **Supabase**              | PostgreSQL database             |
| **Redis**                 | Caching + rate limiting         |
| **BullMQ**                | Event queue                     |
| **Zod**                   | Runtime validation              |
| **bcryptjs**              | API key hashing                 |
| **jsonwebtoken**          | JWT verification                |
| **@org/utils-encryption** | RSA keypair generation          |

## Directory Structure

```
apps/uvian-discord-connector/
├── src/
│   ├── main.ts                          # Entry point (port 3003)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── clients/
│       │   └── supabase.client.ts       # Supabase admin client
│       ├── plugins/
│       │   ├── cache.ts                 # Redis connection + CacheService
│       │   ├── event-emitter.ts         # Discord event emitter (BullMQ)
│       │   ├── gateway.ts               # Discord WebSocket gateway + slash commands
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   └── mcp.plugin.ts            # MCP server (13 Discord tools)
│       ├── routes/
│       │   ├── auth.routes.ts           # POST /api/auth/api-key
│       │   ├── health.routes.ts         # GET /api/health
│       │   └── interactions.ts          # GET/POST /api/interactions (PING)
│       └── services/
│           └── index.ts                 # Service factories (identity, subscription, user, apiKey)
└── package.json
```

## Environment Variables

| Variable                  | Purpose                   | Default                 |
| ------------------------- | ------------------------- | ----------------------- |
| `DISCORD_BOT_TOKEN`       | Discord bot token         | (required)              |
| `DISCORD_APPLICATION_ID`  | Discord application ID    | (required)              |
| `SUPABASE_URL`            | Supabase project URL      | (required)              |
| `SUPABASE_SECRET_KEY`     | Supabase service role key | (required)              |
| `SUPABASE_ANON_KEY`       | Supabase anon key         | (required)              |
| `SUPABASE_JWT_SECRET`     | JWT verification secret   | (required)              |
| `PORT`                    | Server port               | `3003`                  |
| `HOST`                    | Server host               | `localhost`             |
| `FRONTEND_URL`            | CORS origin               | `*`                     |
| `REDIS_HOST`              | Redis host                | `localhost`             |
| `REDIS_PORT`              | Redis port                | `6379`                  |
| `REDIS_PASSWORD`          | Redis password            | (optional)              |
| `REDIS_USERNAME`          | Redis username            | (optional)              |
| `INTAKE_API_URL`          | Intake API URL            | `http://localhost:8001` |
| `DISCORD_CONNECTOR_URL`   | Self-referential URL      | `http://localhost:4000` |
| `SECRET_INTERNAL_API_KEY` | Internal service auth key | (required)              |

## API Endpoints

| Method | Path                | Auth     | Description                   |
| ------ | ------------------- | -------- | ----------------------------- |
| GET    | `/api/health`       | None     | Health check                  |
| GET    | `/api/interactions` | None     | Liveness probe                |
| POST   | `/api/interactions` | None     | Discord PING callback         |
| POST   | `/api/auth/api-key` | Internal | Create Discord-scoped API key |
| POST   | `/v1/mcp`           | Bearer   | MCP server (13 tools)         |
| GET    | `/v1/mcp`           | None     | Returns 405                   |

## MCP Tools (13 total)

`discord_send_dm`, `discord_send_channel`, `discord_get_user`, `discord_get_recent_messages`, `discord_get_messages_before`, `discord_get_messages_after`, `discord_get_message`, `discord_search_channel_messages`, `discord_get_thread_messages`, `discord_get_thread_info`, `discord_get_guild_info`, `discord_get_guild_channels`, `discord_get_member`, `discord_get_channel_info`, `discord_get_message_reactions`

## Slash Commands (3 total)

| Command                  | Description                                      | Auth Required        |
| ------------------------ | ------------------------------------------------ | -------------------- |
| `/link`                  | Creates intake form for linking Discord to Uvian | No                   |
| `/activate agent:<name>` | Activates agent in current channel               | Yes (must be linked) |
| `/deactivate`            | Deactivates agent in current channel             | Yes (must be linked) |

## Architecture

- **Discord.js Gateway** - WebSocket connection listening for messages and interactions
- **Event-driven** - Discord events serialized as CloudEvents and pushed to BullMQ queue
- **MCP server** - 13 tools for AI agents to read/interact with Discord
- **Rate limiting** - Redis-backed sliding window (10 req/10s) on MCP tools
- **Account linking** - `/link` command delegates to intake API with RSA keypair handoff
- **MCP provisioning** - `/activate` emits `MCP_PROVISIONING_REQUESTED` event

## Commands

```bash
# Build
npx nx build @org/uvian-discord-connector

# Serve (development)
npx nx serve @org/uvian-discord-connector

# Test
npx nx test @org/uvian-discord-connector

# Lint
npx nx lint @org/uvian-discord-connector

# Typecheck
npx nx typecheck @org/uvian-discord-connector
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-discord-connector:serve`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-discord-connector/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
