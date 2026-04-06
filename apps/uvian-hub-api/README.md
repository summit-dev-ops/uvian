# uvian-hub-api

Central messaging and collaboration hub API for the Uvian platform. Provides RESTful endpoints and real-time WebSocket communication for chats, spaces, notes, posts, assets, profiles, and user management.

## Tech Stack

| Technology     | Purpose                           |
| -------------- | --------------------------------- |
| **Fastify**    | HTTP framework                    |
| **TypeScript** | Type safety                       |
| **Socket.io**  | Real-time WebSocket communication |
| **BullMQ**     | Redis-backed job queue            |
| **Redis**      | Pub/sub, caching, queue backend   |
| **Supabase**   | PostgreSQL database + auth        |
| **MCP SDK**    | Model Context Protocol server     |
| **Zod**        | Runtime validation                |

## Directory Structure

```
apps/uvian-hub-api/
├── src/
│   ├── main.ts                          # Entry point (port 8000)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── app.spec.ts                  # Health endpoint test
│       ├── clients/
│       │   ├── redis.ts                 # Redis connection singleton
│       │   └── supabase.client.ts       # Supabase admin/anon/user clients
│       ├── plugins/
│       │   ├── auth.plugin.ts           # JWT auth via Supabase
│       │   ├── bullmq.ts                # BullMQ queue decoration
│       │   ├── event-emitter.ts         # Domain event emission
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   ├── mcp.plugin.ts            # MCP server for AI agent access
│       │   ├── redis-subscriber.ts      # Redis pub/sub for real-time events
│       │   ├── sensible.ts              # Error handling
│       │   ├── services.ts              # Service factory decoration
│       │   └── socket-io.ts             # Socket.io WebSocket server
│       ├── routes/
│       │   ├── accounts.routes.ts       # Account management
│       │   ├── assets.ts                # Asset upload/management
│       │   ├── auth.routes.ts           # Auth endpoints
│       │   ├── chat.ts                  # Conversations + messages
│       │   ├── health.routes.ts         # GET /api/health
│       │   ├── notes.routes.ts          # Space notes CRUD
│       │   ├── posts.ts                 # Space posts CRUD
│       │   ├── profiles.ts              # User profiles
│       │   ├── root.ts                  # Root endpoint
│       │   ├── spaces.ts                # Spaces CRUD + membership
│       │   ├── user.ts                  # Current user operations
│       │   └── users.ts                 # User management
│       ├── services/
│       │   ├── factory.ts               # Service factory
│       │   ├── index.ts                 # Re-exports
│       │   ├── asset/                   # Asset service
│       │   ├── chat/                    # Chat service (conversations, messages)
│       │   ├── note/                    # Notes service
│       │   ├── post/                    # Posts service
│       │   ├── spaces/                  # Spaces service
│       │   └── types.ts                 # Service type definitions
│       ├── types/                       # TypeScript types
│       └── utils/                       # Utility functions
└── package.json
```

## Environment Variables

| Variable                   | Purpose                         | Default                 |
| -------------------------- | ------------------------------- | ----------------------- |
| `HOST`                     | Server bind address             | `localhost`             |
| `PORT`                     | Server port                     | `8000`                  |
| `FRONTEND_URL`             | CORS origin                     | `*`                     |
| `SUPABASE_URL`             | Supabase project URL            | (required)              |
| `SUPABASE_SECRET_KEY`      | Supabase service role key       | (required)              |
| `SUPABASE_ANON_KEY`        | Supabase anon key               | (required)              |
| `SUPABASE_JWT_SECRET`      | JWT signing/verification secret | (required)              |
| `REDIS_HOST`               | Redis host                      | `localhost`             |
| `REDIS_PORT`               | Redis port                      | `6379`                  |
| `UVIAN_AUTOMATION_API_URL` | Automation API URL              | `http://localhost:3001` |
| `UVIAN_AUTOMATION_API_KEY` | Internal API key                | (required)              |

## API Endpoints

### Health

| Method | Path          | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/health` | Health check |

### Chat

| Method | Path                                   | Description         |
| ------ | -------------------------------------- | ------------------- |
| GET    | `/api/chat/conversations`              | List conversations  |
| POST   | `/api/chat/conversations`              | Create conversation |
| GET    | `/api/chat/conversations/:id`          | Get conversation    |
| GET    | `/api/chat/conversations/:id/messages` | Get messages        |
| POST   | `/api/chat/conversations/:id/messages` | Send message        |

### Spaces

| Method | Path              | Description  |
| ------ | ----------------- | ------------ |
| GET    | `/api/spaces`     | List spaces  |
| POST   | `/api/spaces`     | Create space |
| GET    | `/api/spaces/:id` | Get space    |
| PUT    | `/api/spaces/:id` | Update space |
| DELETE | `/api/spaces/:id` | Delete space |

### Notes

| Method | Path                         | Description |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/spaces/:spaceId/notes` | List notes  |
| POST   | `/api/spaces/:spaceId/notes` | Create note |
| GET    | `/api/notes/:id`             | Get note    |
| PUT    | `/api/notes/:id`             | Update note |
| DELETE | `/api/notes/:id`             | Delete note |

### Posts

| Method | Path                         | Description |
| ------ | ---------------------------- | ----------- |
| GET    | `/api/spaces/:spaceId/posts` | List posts  |
| POST   | `/api/spaces/:spaceId/posts` | Create post |
| GET    | `/api/posts/:id`             | Get post    |
| PUT    | `/api/posts/:id`             | Update post |
| DELETE | `/api/posts/:id`             | Delete post |

### Assets

| Method | Path                 | Description  |
| ------ | -------------------- | ------------ |
| POST   | `/api/assets/upload` | Upload asset |
| GET    | `/api/assets/:id`    | Get asset    |
| DELETE | `/api/assets/:id`    | Delete asset |

### Profiles

| Method | Path                | Description    |
| ------ | ------------------- | -------------- |
| GET    | `/api/profiles`     | List profiles  |
| GET    | `/api/profiles/:id` | Get profile    |
| PUT    | `/api/profiles/:id` | Update profile |

### Users

| Method | Path             | Description  |
| ------ | ---------------- | ------------ |
| GET    | `/api/users`     | List users   |
| GET    | `/api/users/:id` | Get user     |
| GET    | `/api/user`      | Current user |

### WebSocket (Socket.io)

| Event                  | Direction        | Description            |
| ---------------------- | ---------------- | ---------------------- |
| `join_conversation`    | Client -> Server | Join conversation room |
| `send_message`         | Client -> Server | Send message           |
| `new_message`          | Server -> Client | New message received   |
| `conversation_updated` | Server -> Client | Conversation updated   |

## Architecture

- **Plugin-based Fastify** with `@fastify/autoload`
- **Socket.io** for real-time messaging with Supabase token auth
- **Redis pub/sub** for cross-instance event broadcasting
- **BullMQ** for background job processing
- **Service layer** with scoped (user) and admin access patterns
- **MCP server** for AI agent access to hub resources

## Commands

```bash
# Build
npx nx build @org/uvian-hub-api

# Serve (development)
npx nx serve @org/uvian-hub-api

# Test
npx nx test @org/uvian-hub-api

# Lint
npx nx lint @org/uvian-hub-api

# Typecheck
npx nx typecheck @org/uvian-hub-api
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-hub-api:serve:production`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-hub-api/**`, `packages/uvian-events/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
