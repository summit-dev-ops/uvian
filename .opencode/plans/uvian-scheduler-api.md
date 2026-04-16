# Uvian Scheduler API - Product Guide

## Overview

The **Uvian Scheduler API** is a Fastify-based microservice that handles cron-based task scheduling for the Uvian Agent Collaboration & Orchestration Platform. It enables users to create, manage, and execute one-time and recurring scheduled tasks that trigger downstream actions through an event-driven architecture.

## What Is This App?

The Scheduler API is the timing and orchestration backbone for time-based workflows in Uvian. It allows users and AI agents to:

- **Schedule one-time tasks** that execute at a specific datetime
- **Schedule recurring tasks** using cron expressions (daily, weekly, monthly, custom)
- **Pause and resume** active schedules without losing configuration
- **Cancel** schedules when no longer needed
- **Track execution history** including success/failure and retry attempts

The Scheduler API does not execute tasks directly. Instead, it emits CloudEvents when schedules fire, which are then processed by the `uvian-event-worker` for actual task execution.

## Key Features and Capabilities

### 1. One-Time Schedules
- Execute a task once at a specified datetime
- Automatically marked as `completed` after execution
- Supports custom `eventData` payload for downstream processing

### 2. Recurring Schedules
- Use standard cron expressions for flexible scheduling
- Automatically computes next run time after each execution
- Supports start/end dates to define schedule boundaries
- Example expressions:
  - `0 9 * * *` - Daily at 9:00 AM
  - `0 9 * * 1` - Weekly on Monday at 9:00 AM
  - `0 0 1 * *` - Monthly on the 1st at midnight

### 3. Pause/Resume
- Pause active schedules without losing configuration
- Resume recalculates next run time from current moment
- Ideal for temporary workflow suspension

### 4. Retry Logic
- Maximum 3 retries by default (configurable)
- Increments `retry_count` on failure
- Cancels schedule after exhausting retries
- Captures `last_error` for debugging

### 5. Execution Tracking
- `last_executed_at` - timestamp of last execution attempt
- `last_successful_executed_at` - timestamp of last successful execution
- Full audit trail in database

### 6. MCP Tools for AI Agents
Seven tools exposed via Model Context Protocol for AI agent interaction:
- `create_schedule` - Create new schedules
- `list_schedules` - List user's schedules with optional status filter
- `get_schedule` - Get details of a specific schedule
- `cancel_schedule` - Cancel a schedule
- `pause_schedule` - Pause an active schedule
- `resume_schedule` - Resume a paused schedule
- `update_schedule` - Update schedule configuration

## User Value

### Why Does a User Care?

1. **Automate Time-Based Workflows**: Users can schedule reports, reminders, data sync jobs, and other recurring tasks without manual intervention.

2. **Agent-Driven Scheduling**: AI agents can create and manage schedules autonomously, enabling self-healing systems and proactive automation.

3. **Reliability**: Built-in retry logic and distributed locking ensures schedules fire reliably even in multi-instance deployments.

4. **Visibility**: Full execution history allows users to monitor schedule health and debug failures.

5. **Integration**: Events are emitted in a standard CloudEvents format, making it easy to connect with any downstream system.

## Key User Workflows and Use Cases

### Workflow 1: Create a Daily Report Schedule
```
POST /api/schedules
{
  "type": "recurring",
  "cronExpression": "0 8 * * *",
  "eventData": {
    "reportType": "daily_sales",
    "recipients": ["team@company.com"]
  },
  "subscriberIds": ["user-uuid"]
}
```

### Workflow 2: Pause a Schedule During Maintenance
```
POST /api/schedules/schedule-uuid/pause
```

### Workflow 3: Resume After Maintenance
```
POST /api/schedules/schedule-uuid/resume
```

### Workflow 4: AI Agent Creates a Schedule via MCP
```json
{
  "name": "create_schedule",
  "arguments": {
    "type": "recurring",
    "cronExpression": "*/15 * * * *",
    "eventData": {
      "task": "data_sync",
      "source": "external_api"
    }
  }
}
```

## How It Fits Into the Overall Platform

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UVIAN PLATFORM                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐     ┌──────────────────┐                  │
│  │   Uvian Web App     │     │  AI Agents       │                  │
│  │   (Frontend)        │     │  (via MCP)       │                  │
│  └─────────┬───────────┘     └────────┬─────────┘                  │
│            │                            │                           │
│            ▼                            ▼                           │
│  ┌─────────────────────────────────────────────┐                   │
│  │           Uvian Hub API (Fastify)            │                   │
│  │  - Authentication                            │                   │
│  │  - User management                           │                   │
│  │  - Schedule CRUD routes                      │                   │
│  └─────────────────────────────────────────────┘                   │
│                       │                                             │
│                       ▼                                             │
│  ┌─────────────────────────────────────────────┐                   │
│  │       UVIAN-SCHEDULER-API (Fastify)         │                   │
│  │  - Cron sync loop (node-cron)               │                   │
│  │  - Redis distributed locking                │                   │
│  │  - BullMQ job queue                          │                   │
│  │  - MCP server (7 tools)                     │                   │
│  └──────────────────┬──────────────────────────┘                   │
│                     │                                                │
│                     ▼                                                │
│  ┌─────────────────────────────────────────────┐                   │
│  │       UVIAN-EVENT-WORKER                    │                   │
│  │  - Consumes SCHEDULE_FIRED events          │                   │
│  │  - Executes actual task logic              │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technical Architecture

### Framework and Key Libraries

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework |
| **TypeScript** | Type safety |
| **node-cron** | Periodic sync loop |
| **cron-parser** | Cron expression validation + next run computation |
| **BullMQ** | Job queue for firing scheduled events |
| **ioredis** | Redis client for distributed locking |
| **Supabase** | PostgreSQL (`core_scheduler` schema) |
| **MCP SDK** | Model Context Protocol server |
| **Zod** | Runtime validation |
| **jsonwebtoken** | JWT verification |

### Key Routes and Their Purposes

#### Health Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check endpoint |

#### Schedule Routes (Authenticated)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/schedules` | Create a new schedule |
| GET | `/api/schedules` | List user's schedules |
| GET | `/api/schedules/:id` | Get schedule details |
| PUT | `/api/schedules/:id` | Update schedule |
| DELETE | `/api/schedules/:id` | Cancel schedule |
| POST | `/api/schedules/:id/pause` | Pause schedule |
| POST | `/api/schedules/:id/resume` | Resume schedule |
| PATCH | `/api/schedules/:id/execute` | Mark schedule as executed |

#### Auth Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/api-key` | Internal/User | Create API key |
| DELETE | `/api/auth/api-key` | Internal/User | Revoke API key |

#### Cron Routes (Internal)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/sync` | Internal | Trigger cron sync manually |
| GET | `/api/cron/status` | None | Get cron sync status |

#### MCP Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/mcp` | Bearer `sk_agent_*` or JWT | MCP server (7 tools) |
| GET | `/v1/mcp` | None | Returns 405 (stateless MCP) |

### MCP Tools Exposed

| Tool Name | Input | Description |
|-----------|-------|-------------|
| `create_schedule` | `type`, `start`, `end`, `cronExpression`, `eventData` | Create a new schedule |
| `list_schedules` | `status`, `limit` | List schedules with optional filters |
| `get_schedule` | `scheduleId` | Get schedule details |
| `cancel_schedule` | `scheduleId` | Cancel a schedule |
| `pause_schedule` | `scheduleId` | Pause an active schedule |
| `resume_schedule` | `scheduleId` | Resume a paused schedule |
| `update_schedule` | `scheduleId`, `start`, `end`, `cronExpression`, `eventData` | Update schedule |

### Event Types Produced

The Scheduler API emits CloudEvents via the queue service when schedule state changes:

| Event | Type | Data |
|-------|------|------|
| `SCHEDULE_CREATED` | `com.uvian.schedule.schedule_created` | scheduleId, type, cronExpression, subscriberIds, createdBy |
| `SCHEDULE_UPDATED` | `com.uvian.schedule.schedule_updated` | scheduleId, updatedBy |
| `SCHEDULE_CANCELLED` | `com.uvian.schedule.schedule_cancelled` | scheduleId, cancelledBy |
| `SCHEDULE_FIRED` | `com.uvian.schedule.schedule_fired` | scheduleId, type, eventData, firedAt |
| `SCHEDULE_COMPLETED` | `com.uvian.schedule.schedule_completed` | scheduleId, completedAt |
| `SCHEDULE_FAILED` | `com.uvian.schedule.schedule_failed` | scheduleId, error, retryCount |

### Database Schema

**Table: `core_scheduler.schedules`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner user |
| `type` | TEXT | `one_time` or `recurring` |
| `start` | TIMESTAMPTZ | Start datetime (nullable) |
| `end` | TIMESTAMPTZ | End datetime (nullable) |
| `cron_expression` | VARCHAR(100) | Cron expression for recurring |
| `next_run_at` | TIMESTAMPTZ | Next scheduled execution time |
| `status` | TEXT | `active`, `paused`, `completed`, `cancelled` |
| `event_data` | JSONB | Custom data payload |
| `retry_count` | INT | Number of retry attempts |
| `max_retries` | INT | Maximum retry attempts (default 3) |
| `last_error` | TEXT | Last error message |
| `last_executed_at` | TIMESTAMPTZ | Last execution timestamp |
| `last_successful_executed_at` | TIMESTAMPTZ | Last successful execution |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_schedules_active_next_run` - For efficient cron sync queries
- `idx_schedules_user_id` - For user-scoped queries

### Cron Synchronization Approach

The Scheduler API uses a **distributed locking mechanism with Redis** to ensure only one instance processes schedules in a multi-instance deployment:

```
node-cron (every N minutes, default 15)
    │
    ▼
Redis distributed lock (scheduler:cron:lock, 120s TTL)
    │
    ▼
Query Supabase for active schedules where next_run_at <= now + sync_window
    │
    ▼
fireSchedule()
    │
    ├── Create CloudEvent (ScheduleEvents.SCHEDULE_FIRED)
    ├── Enqueue in BullMQ with scheduled fire timestamp
    ├── One-time: mark completed
    └── Recurring: compute next run, update next_run_at
```

**Key behaviors:**
- **Immediate firing**: If `nextRunAt` is within the sync window when a schedule is created/updated/resumed, it's queued immediately
- **Retry logic**: Max 3 retries before cancellation
- **Lock timeout**: 120 seconds to prevent stale lock issues

## Integration Points

### Services Called

1. **Supabase (PostgreSQL)**
   - Read/write schedules in `core_scheduler.schedules`
   - User authentication verification
   - API key validation

2. **Redis**
   - Distributed locking for cron synchronization
   - BullMQ queue backend

3. **BullMQ (via queueService)**
   - Enqueue scheduled events for processing
   - Job scheduled with fire timestamp

4. **Internal Services (via factory)**
   - `apiKeyService` - API key management
   - `subscriptionService` - Subscription handling for schedule notifications
   - `queueService` - Event queue operations

### How It Integrates with uvian-event-worker

1. When a schedule fires, the Scheduler API creates a CloudEvent with type `SCHEDULE_FIRED`
2. The event is enqueued in BullMQ with the scheduled fire timestamp
3. The `uvian-event-worker` consumes the event from the queue
4. The worker processes the event based on `eventData` payload
5. The worker can call back to the Scheduler API to mark execution success/failure via `PATCH /api/schedules/:id/execute`

### How Scheduled Tasks Are Triggered

1. **Cron Sync Loop** runs every N minutes (configurable via `SCHEDULER_SYNC_INTERVAL_MINUTES`)
2. Acquires Redis distributed lock to prevent duplicate processing
3. Queries for active schedules where `next_run_at <= now + sync_window`
4. For each due schedule:
   - Creates a `SCHEDULE_FIRED` CloudEvent
   - Enqueues in BullMQ with the scheduled timestamp
   - Updates `last_executed_at`
   - For one-time: marks as `completed`
   - For recurring: computes next run time and updates `next_run_at`

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `3003` |
| `FRONTEND_URL` | CORS origin | `*` |
| `SUPABASE_URL` | Supabase project URL | (required) |
| `SUPABASE_SECRET_KEY` | Supabase service role key | (required) |
| `SUPABASE_ANON_KEY` | Supabase anon key | (required) |
| `SUPABASE_JWT_SECRET` | JWT verification secret | (required) |
| `SECRET_INTERNAL_API_KEY` | Internal service auth key | (required) |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | (optional) |
| `REDIS_USERNAME` | Redis username | (optional) |
| `SCHEDULER_SYNC_INTERVAL_MINUTES` | Cron sync interval | `15` |

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

The Scheduler API is deployed on **Railway**:
- **Start command:** `npx nx run @org/uvian-scheduler-api:serve`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-scheduler-api/**`, `packages/services/queue/**`
