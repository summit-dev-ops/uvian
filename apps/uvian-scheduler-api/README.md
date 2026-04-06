# uvian-scheduler-api

Time-based scheduling microservice. Manages one-time and recurring scheduled tasks using cron expressions, emits CloudEvents when schedules fire, and exposes an MCP server for AI agent schedule management.

## Tech Stack

| Technology       | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| **Fastify**      | HTTP framework                                    |
| **TypeScript**   | Type safety                                       |
| **node-cron**    | Periodic sync loop                                |
| **cron-parser**  | Cron expression validation + next run computation |
| **BullMQ**       | Job queue for firing scheduled events             |
| **Redis**        | Distributed locking + queue backend               |
| **Supabase**     | PostgreSQL (`core_scheduler` schema)              |
| **MCP SDK**      | Model Context Protocol server                     |
| **Zod**          | Runtime validation                                |
| **bcryptjs**     | API key hashing                                   |
| **jsonwebtoken** | JWT verification                                  |

## Directory Structure

```
apps/uvian-scheduler-api/
├── src/
│   ├── main.ts                          # Entry point (port 3003)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── clients/
│       │   ├── redis.ts                 # Redis connection (ioredis)
│       │   └── supabase.client.ts       # Supabase admin/anon/user clients
│       ├── plugins/
│       │   ├── auth.plugin.ts           # JWT auth via Supabase
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   ├── cron.plugin.ts           # Cron sync loop + Redis distributed lock
│       │   ├── mcp.plugin.ts            # MCP server (7 tools)
│       │   ├── event-emitter.ts         # Scheduler event emitter
│       │   └── services.ts              # Service decoration
│       ├── routes/
│       │   ├── health.routes.ts         # GET /api/health
│       │   ├── schedule.routes.ts       # CRUD + pause/resume
│       │   ├── auth.routes.ts           # API key management
│       │   └── cron.routes.ts           # POST /api/cron/sync (internal)
│       └── services/
│           ├── factory.ts               # Service factory
│           ├── index.ts                 # Re-exports
│           └── schedule/
│               ├── index.ts             # ScheduleService interface + factory
│               ├── types.ts             # Schedule, ScheduleStatus, etc.
│               └── scoped.ts            # Full CRUD implementation
└── package.json
```

## Environment Variables

| Variable                          | Purpose                   | Default     |
| --------------------------------- | ------------------------- | ----------- |
| `HOST`                            | Server bind address       | `0.0.0.0`   |
| `PORT`                            | Server port               | `3003`      |
| `FRONTEND_URL`                    | CORS origin               | `*`         |
| `SUPABASE_URL`                    | Supabase project URL      | (required)  |
| `SUPABASE_SECRET_KEY`             | Supabase service role key | (required)  |
| `SUPABASE_ANON_KEY`               | Supabase anon key         | (required)  |
| `SUPABASE_JWT_SECRET`             | JWT verification secret   | (required)  |
| `SECRET_INTERNAL_API_KEY`         | Internal service auth key | (required)  |
| `REDIS_HOST`                      | Redis host                | `localhost` |
| `REDIS_PORT`                      | Redis port                | `6379`      |
| `REDIS_PASSWORD`                  | Redis password            | (optional)  |
| `REDIS_USERNAME`                  | Redis username            | (optional)  |
| `SCHEDULER_SYNC_INTERVAL_MINUTES` | Cron sync interval        | `15`        |

## API Endpoints

### Health

| Method | Path          | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/health` | Health check |

### Schedules (authenticated)

| Method | Path                        | Description     |
| ------ | --------------------------- | --------------- |
| POST   | `/api/schedules`            | Create schedule |
| GET    | `/api/schedules`            | List schedules  |
| GET    | `/api/schedules/:id`        | Get schedule    |
| PUT    | `/api/schedules/:id`        | Update schedule |
| DELETE | `/api/schedules/:id`        | Cancel schedule |
| POST   | `/api/schedules/:id/pause`  | Pause schedule  |
| POST   | `/api/schedules/:id/resume` | Resume schedule |

### Auth

| Method | Path                | Auth          | Description    |
| ------ | ------------------- | ------------- | -------------- |
| POST   | `/api/auth/api-key` | Internal/User | Create API key |
| DELETE | `/api/auth/api-key` | Internal/User | Revoke API key |

### Cron (internal)

| Method | Path             | Auth     | Description       |
| ------ | ---------------- | -------- | ----------------- |
| POST   | `/api/cron/sync` | Internal | Trigger cron sync |

### MCP

| Method | Path      | Auth                | Description          |
| ------ | --------- | ------------------- | -------------------- |
| POST   | `/v1/mcp` | Bearer `sk_agent_*` | MCP server (7 tools) |
| GET    | `/v1/mcp` | None                | Returns 405          |

### MCP Tools (7 total)

`create_schedule`, `list_schedules`, `get_schedule`, `cancel_schedule`, `pause_schedule`, `resume_schedule`, `update_schedule`

## Scheduling Architecture

```
node-cron (every N minutes)
    |
    v
Redis distributed lock (scheduler:cron:lock, 120s TTL)
    |
    v
Query Supabase for active schedules where next_run_at <= now + sync_window
    |
    v
fireSchedule()
    |
    +-- Create CloudEvent (ScheduleEvents.SCHEDULE_FIRED)
    +-- Enqueue in BullMQ with scheduled fire timestamp
    +-- One-time: mark completed
    +-- Recurring: compute next run, update next_run_at
```

- **Immediate firing** - if nextRunAt within sync window on create/update/resume, queued immediately
- **Retry logic** - max 3 retries before cancellation
- **Event-driven** - emits SCHEDULE_CREATED, SCHEDULE_UPDATED, SCHEDULE_CANCELLED, SCHEDULE_FIRED

## Commands

```bash
# Build
npx nx build @org/uvian-scheduler-api

# Serve (development)
npx nx serve @org/uvian-scheduler-api

# Test
npx nx test @org/uvian-scheduler-api

# Lint
npx nx lint @org/uvian-scheduler-api

# Typecheck
npx nx typecheck @org/uvian-scheduler-api
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-scheduler-api:serve`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-scheduler-api/**`, `packages/services/queue/**`
