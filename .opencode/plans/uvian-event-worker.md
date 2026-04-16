# Uvian Event Worker - Product Guide

## Overview

The **uvian-event-worker** is a background event distribution engine that forms a critical component of the Uvian Agent Collaboration and Orchestration Platform. It consumes CloudEvents from a BullMQ Redis queue and routes them to subscribed automation providers, enabling the platform's event-driven automation capabilities.

## What Is This App?

The Event Worker is a TypeScript-based background service that:

1. **Consumes events** from a Redis-backed BullMQ job queue named `uvian-events`
2. **Parses CloudEvents** to extract resource type and ID from the event source
3. **Looks up subscriptions** to find which automation providers are interested in the event
4. **Routes events** to providers via either internal API calls or external webhooks
5. **Manages cache** invalidation to ensure subscription data stays fresh

This is the bridge between the platform's event emitting services (API, webhooks, user actions) and the automation layer that triggers agent actions.

## Key Features and Capabilities

### Event Routing

The Event Router handles multiple event categories:

| Event Category | Description | Action |
|----------------|-------------|--------|
| **Automation Provider Events** | Created, updated, deleted providers | Invalidate related subscription caches |
| **Subscription Events** | Subscriptions created or deleted | Invalidate resource subscription cache |
| **Member Events** | Users joining/leaving spaces, conversations, role changes | Invalidate resource subscription cache |
| **Intake Events** | Form submissions completed, created, revoked | Route to intake subscribers |
| **MCP Provisioning Events** | Agent MCP setup requested | Route to internal automation provider |
| **Default Events** | Standard resource events (messages, jobs, tickets, etc.) | Route to all subscribers |

### Provider Types

The worker supports two provider types:

1. **Internal Providers** - Route events to the uvian-automation-api for internal agent handling
2. **Webhook Providers** - Send events to external HTTP endpoints with configurable authentication

### Authentication Methods

For webhook providers, the event worker supports:

- **Bearer Token** - `Authorization: Bearer {token}`
- **API Key** - `X-API-Key: {apiKey}`

### Caching Strategy

The worker uses a Redis-based proxy caching mechanism:

- Subscription lookups are cached with a default TTL of 300 seconds
- Cache key format: `cache:{serviceName}:{methodName}:{JSON(args)}`
- Automatic invalidation on subscription changes, member changes, and provider changes

## User Value

Users care about the Event Worker because it:

1. **Enables automation workflows** - When a user submits an intake form, the event worker triggers any subscribed automation providers to process the submission automatically

2. **Decouples systems** - Producers of events don't need to know about consumers; subscriptions handle the routing logic

3. **Provides reliable delivery** - BullMQ handles job persistence, retries, and rate limiting to ensure events are delivered even under load

4. **Scales efficiently** - Redis caching reduces database load for subscription lookups, and the worker can scale horizontally

5. **Supports external integrations** - Webhook providers allow third-party services to react to platform events

## User Workflows and Use Cases

### Workflow 1: Form Submission Automation

1. User submits an intake form (com.uvian.intake.completed event emitted)
2. Event is added to the BullMQ queue
3. Event Worker picks up the job, parses the intake ID
4. Worker queries subscriptions for the intake resource type
5. Worker routes the event to all subscribed providers
6. Providers (internal agents or webhooks) process the submission

### Workflow 2: Real-time Agent Notifications

1. New message in a conversation (com.uvian.conversation.message_created emitted)
2. Event Worker routes to providers subscribed to that conversation
3. Internal providers receive the event via the automation API
4. Agents can respond in real-time based on the event

### Workflow 3: External System Integration

1. User adds a webhook provider to their account
2. The subscription links the provider to resources (spaces, conversations, etc.)
3. When relevant events occur, the Event Worker POSTs to the webhook URL
4. External systems receive and process Uvian events

### Workflow 4: MCP Agent Provisioning

1. Agent requests MCP (Model Context Protocol) setup
2. MCP provisioning event emitted (com.uvian.core.mcp-provisioning.requested)
3. Event Worker finds the internal provider for the account
4. Event is routed to the automation API for agent-specific processing

## Platform Integration

The Event Worker sits between the event producers and the automation layer:

```
┌─────────────────┐     ┌─────────────────────┐     ┌────────────────────────┐
│  Event Sources  │────▶│  BullMQ Queue        │────▶│  Event Worker          │
│  - API          │     │  (Redis)            │     │  (Processing Engine)   │
│  - Webhooks     │     │                     │     │                        │
│  - User Actions │     │                     │     │  - Route events        │
└─────────────────┘     └─────────────────────┘     │  - Find subscriptions   │
                                                    │  - Deliver to providers│
                                                    └───────────┬────────────┘
                                                                │
                           ┌────────────────────────────────────┼────────────────────┐
                           │                    ┌───────────────┴───────────────┐  │
                           │                    │  Providers                    │  │
                           │                    │  ┌─────────────────────────┐  │  │
                           │                    │  │ Internal (Automation API)│  │  │
                           │                    │  └─────────────────────────┘  │  │
                           │                    │  ┌─────────────────────────┐  │  │
                           │                    │  │ Webhooks (External)     │  │  │
                           │                    │  └─────────────────────────┘  │  │
                           │                    └───────────────────────────────┘  │
                           │                                        │              │
                           │                    ┌──────────────────▼──────────────┐│
                           │                    │  uvian-automation-worker       ││
                           │                    │  (Python worker for jobs)      ││
                           │                    └─────────────────────────────────┘│
                           └───────────────────────────────────────────────────────┘
```

## Technical Details

### Framework and Key Libraries

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe runtime |
| **BullMQ** | Redis-backed job queue worker with concurrency and rate limiting |
| **ioredis** | Redis client for queue and caching |
| **@supabase/supabase-js** | PostgreSQL client for subscription lookups |
| **@org/uvian-events** | CloudEvent type definitions |
| **@org/services-subscription** | Subscription management service |
| **@org/utils-cache** | Proxy-based Redis caching wrapper |

### Event Types Consumed

The worker handles events from all Uvian domains:

- **Messaging** (8 events): message_created, message_updated, message_deleted, conversation_created, conversation_updated, conversation_deleted, member_joined, member_left
- **Spaces** (6 events): space_created, space_updated, space_deleted, member_joined, member_left, member_role_changed
- **Content** (8 events)
- **Jobs** (6 events)
- **Tickets** (5 events)
- **Users** (3 events)
- **Accounts** (5 events)
- **Agents** (5 events): agent_created, agent_updated, agent_deleted, agent_activated, agent_deactivated
- **Intake** (4 events): intake_created, intake_completed, intake_revoked, intake_deleted
- **Core** (9 events): automation-provider created/updated/deleted, subscription created/deleted, identity created/updated/deleted, mcp-provisioning_requested
- **Discord** (4 events)
- **Schedules** (6 events)

### Event Types Produced

The worker produces HTTP POST requests to:

1. **Internal Automation API**: `POST {UVIAN_AUTOMATION_API_URL}/api/webhooks/agents/{agentId}/events`
2. **External Webhooks**: `POST {providerUrl}`

### Resource Type Mapping

| Source Path | Resource Type |
|-------------|---------------|
| `/conversations/:id` | uvian.conversation |
| `/spaces/:id` | uvian.space |
| `/intakes/:id` | uvian.intake |
| `/jobs/:id` | uvian.job |
| `/tickets/:id` | uvian.ticket |
| `/agents/:id` | uvian.agent |
| `/discord/:id` | discord.channel |
| `/schedules/:id` | uvian.schedule |

## Integration Points

### uvian-automation-api

The Event Worker calls the automation API for internal providers:

```
POST {UVIAN_AUTOMATION_API_URL}/api/webhooks/agents/{agentId}/events
Headers:
  Content-Type: application/json
  x-api-key: {UVIAN_AUTOMATION_API_KEY}
Body: { CloudEvent }
```

This endpoint is used by the automation API to receive events for agents and trigger automation rules.

### Database (Supabase)

The worker queries subscription data from PostgreSQL via Supabase:

- `subscriptions` table - stores resource subscriptions
- `automaton_providers` table - stores provider configuration
- `get_subscription_providers_for_resource` - database function that joins subscriptions with providers

### Redis

Redis serves two purposes:

1. **Queue Backend** - BullMQ uses Redis for job storage and processing
2. **Cache** - Subscription data is cached with configurable TTL

### uvian-automation-worker (Python)

While not directly called by the Event Worker, the Python automation worker (uvian-automation-worker) processes the events delivered via the automation API. This is the final destination for internal provider events where actual automation jobs are executed.

## Architecture Decisions

### Why BullMQ?

- Built on Redis (already required for caching)
- Supports concurrency and rate limiting out of the box
- Handles job persistence and retries
- Production-proven for event-driven systems

### Why Proxy-based Caching?

The `@org/utils-cache` package uses JavaScript Proxy to wrap services, providing transparent caching without modifying service code. This keeps the subscription service clean while adding Redis caching.

### Why Fire-and-Forget Routing?

Individual provider delivery failures don't block other providers. This ensures one misconfigured webhook doesn't prevent other valid providers from receiving the event.

### Why Actor Filtering?

The worker filters events where the actor (user who triggered the event) is the same as the subscriber's dependent user. This prevents agents from receiving events they themselves triggered, avoiding infinite loops.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Yes | - | Supabase service role key |
| `REDIS_HOST` | No | localhost | Redis host |
| `REDIS_PORT` | No | 6379 | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password |
| `REDIS_USERNAME` | No | - | Redis username |
| `UVIAN_AUTOMATION_API_URL` | No | http://localhost:3001 | Internal automation API URL |
| `UVIAN_AUTOMATION_API_KEY` | Yes | - | API key for internal automation API |
| `SUBSCRIPTION_CACHE_TTL` | No | 300 | Subscription cache TTL in seconds |

## Running the Application

```bash
# Build the application
npx nx build @org/uvian-event-worker

# Start in development mode
npx nx start @org/uvian-event-worker

# Start in production mode
npx nx run @org/uvian-event-worker:start:production

# Lint
npx nx lint @org/uvian-event-worker
```

## Deployment

The Event Worker is deployed on Railway with:

- **Start command**: `npx nx run @org/uvian-event-worker:start:production`
- **Restart policy**: on_failure (production), always (staging)
- **Concurrency settings**: 5 parallel jobs, rate limited to 10 jobs/second

## Troubleshooting

### Events Not Being Delivered

1. Check Redis connection - `redis-cli PING`
2. Check BullMQ queue - inspect `uvian-events` queue in Redis
3. Check subscription data - verify subscriptions exist in database
4. Check provider configuration - ensure URLs and auth are correct

### High Memory Usage

- Reduce SUBSCRIPTION_CACHE_TTL
- Check for subscription lookups with missing resource IDs

### Rate Limiting Issues

- Adjust BullMQ limiter settings in main.ts
- Consider scaling horizontally with multiple worker instances
