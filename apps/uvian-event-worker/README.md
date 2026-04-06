# uvian-event-worker

Background event distribution engine. Consumes CloudEvents from a BullMQ Redis queue, routes them to subscribed automation providers (internal or external webhooks), and manages cache invalidation.

## Tech Stack

| Technology                     | Purpose                              |
| ------------------------------ | ------------------------------------ |
| **TypeScript**                 | Type safety                          |
| **BullMQ**                     | Redis-backed job queue consumer      |
| **Redis**                      | Queue backend + subscription caching |
| **Supabase**                   | PostgreSQL database                  |
| **@org/uvian-events**          | CloudEvent type definitions          |
| **@org/services-subscription** | Subscription lookup service          |
| **@org/utils-cache**           | Proxy-based Redis caching utility    |

## Directory Structure

```
apps/uvian-event-worker/
├── src/
│   ├── main.ts                          # Entry point: BullMQ Worker bootstrap
│   ├── clients/
│   │   ├── redis.ts                     # ioredis connection singleton
│   │   └── supabase.ts                  # Supabase admin client singleton
│   └── services/
│       ├── factory.ts                   # Creates cached subscription service
│       └── event-router.service.ts      # Core event routing logic (472 lines)
└── package.json
```

## Environment Variables

| Variable                   | Purpose                          | Default                 |
| -------------------------- | -------------------------------- | ----------------------- |
| `SUPABASE_URL`             | Supabase project URL             | (required)              |
| `SUPABASE_SECRET_KEY`      | Supabase service role key        | (required)              |
| `REDIS_HOST`               | Redis host                       | `localhost`             |
| `REDIS_PORT`               | Redis port                       | `6379`                  |
| `REDIS_FAMILY`             | Redis IP family                  | `0`                     |
| `REDIS_PASSWORD`           | Redis password                   | (optional)              |
| `REDIS_USERNAME`           | Redis username                   | (optional)              |
| `UVIAN_AUTOMATION_API_URL` | Internal automation API URL      | `http://localhost:3001` |
| `UVIAN_AUTOMATION_API_KEY` | Internal automation API key      | (required)              |
| `SUBSCRIPTION_CACHE_TTL`   | Subscription cache TTL (seconds) | `300`                   |

## Event Processing Architecture

```
BullMQ Queue ("uvian-events")
    |
    v
Worker (concurrency: 5, rate limit: 10/sec)
    |
    v
EventRouter.processEvent()
    |
    +-- Automation Provider Events -> Invalidate provider caches
    +-- Parse Source -> Extract resource type + ID
    +-- Subscription Events -> Invalidate resource cache
    +-- Member Events -> Invalidate resource cache
    +-- Intake Events -> Route to intake subscribers
    +-- MCP Provisioning -> Route to internal provider
    +-- Default -> Route to all subscribers
    |
    +-- Internal Provider -> POST to automation API
    +-- Webhook Provider -> POST to external URL
```

### Resource Type Map

| Source Path          | Resource Type        |
| -------------------- | -------------------- |
| `/conversations/:id` | `uvian.conversation` |
| `/spaces/:id`        | `uvian.space`        |
| `/intakes/:id`       | `uvian.intake`       |
| `/jobs/:id`          | `uvian.job`          |
| `/tickets/:id`       | `uvian.ticket`       |
| `/agents/:id`        | `uvian.agent`        |
| `/discord/:id`       | `discord.channel`    |
| `/schedules/:id`     | `uvian.schedule`     |

### Event Domains Handled

Messaging (8), Spaces (6), Content (8), Jobs (6), Tickets (5), Users (3), Accounts (5), Agents (5), Intake (3), Core (8), Discord (4), Schedules (6)

### Caching Strategy

- Subscription lookups cached in Redis via `Proxy`-based `withCache` utility
- Cache key: `cache:{serviceName}:{methodName}:{JSON(args)}`
- Cache TTL: 300 seconds (configurable)
- Explicit invalidation on subscription/member/automation-provider events

## Architecture

- **CloudEvents spec v1.0** compliance - all events follow `com.uvian.*` prefix convention
- **Proxy-based caching** - transparent Redis caching via JavaScript Proxy wrapper
- **Fire-and-Forget routing** - individual provider failures logged but don't block others
- **Two provider types** - `internal` (routed to automation API) and `webhook` (external URLs)
- **Singleton clients** - Redis and Supabase initialized on import

## Commands

```bash
# Build
npx nx build @org/uvian-event-worker

# Start (development)
npx nx start @org/uvian-event-worker

# Start (production)
npx nx run @org/uvian-event-worker:start:production

# Lint
npx nx lint @org/uvian-event-worker
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-event-worker:start:production`
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-event-worker/**`, `packages/uvian-events/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
