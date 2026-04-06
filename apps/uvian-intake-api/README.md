# uvian-intake-api

Ephemeral intake form management API. Creates time-limited, TTL-expiring forms with E2E encryption support, optional authentication, and an MCP interface for AI agent programmatic management.

## Tech Stack

| Technology                | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| **Fastify**               | HTTP framework                                               |
| **TypeScript**            | Type safety                                                  |
| **Supabase**              | PostgreSQL (`core_intake` schema)                            |
| **BullMQ**                | Event queue                                                  |
| **Redis**                 | Queue backend                                                |
| **MCP SDK**               | Model Context Protocol server                                |
| **Zod**                   | Runtime validation                                           |
| **bcryptjs**              | API key hashing                                              |
| **@org/utils-encryption** | RSA key generation, hybrid encryption                        |
| **@org/uvian-events**     | Typed events (IntakeCreated, IntakeCompleted, IntakeRevoked) |

## Directory Structure

```
apps/uvian-intake-api/
├── src/
│   ├── main.ts                          # Entry point (port 8001)
│   └── app/
│       ├── app.ts                       # Auto-loads plugins + routes
│       ├── app.spec.ts                  # Health endpoint test
│       ├── clients/
│       │   └── supabase.client.ts       # Supabase admin/anon/user clients
│       ├── plugins/
│       │   ├── auth.plugin.ts           # Supabase JWT auth
│       │   ├── encryption.plugin.ts     # AES-256-CBC encryption
│       │   ├── event-emitter.ts         # Intake event emitter
│       │   ├── internal-auth.ts         # Internal API key / JWT auth
│       │   ├── mcp.plugin.ts            # MCP server (12 tools)
│       │   ├── queue.plugin.ts          # BullMQ queue service
│       │   └── supabase.plugin.ts       # Supabase admin client
│       ├── routes/
│       │   ├── api-keys.routes.ts       # API key management
│       │   ├── intakes.routes.ts        # Internal intake CRUD
│       │   └── public.v1.routes.ts      # Public intake endpoints
│       ├── services/
│       │   ├── factory.ts               # Service factory
│       │   ├── index.ts                 # Re-exports
│       │   └── intake/
│       │       ├── index.ts             # Service creator
│       │       ├── admin.ts             # Admin operations
│       │       ├── scoped.ts            # User-scoped operations
│       │       └── types.ts             # TypeScript interfaces
│       └── types/
│           └── fastify.d.ts             # Fastify module augmentation
├── supabase/
│   └── migrations/
│       ├── 001_create_core_intake_schema.sql
│       ├── 002_create_submissions_table.sql
│       ├── 003_add_public_key_to_intakes.sql
│       ├── 003_add_submission_id_to_intakes.sql
│       └── 005_add_requires_auth_and_submitted_by.sql
└── package.json
```

## Environment Variables

| Variable                  | Purpose                                  | Default                    |
| ------------------------- | ---------------------------------------- | -------------------------- |
| `HOST`                    | Server bind address                      | `localhost`                |
| `PORT`                    | Server port                              | `8001`                     |
| `SUPABASE_URL`            | Supabase project URL                     | (required)                 |
| `SUPABASE_SERVICE_KEY`    | Supabase service role key                | (required)                 |
| `SUPABASE_ANON_KEY`       | Supabase anon key                        | (required)                 |
| `SUPABASE_JWT_SECRET`     | JWT verification secret                  | (required)                 |
| `SECRET_INTERNAL_API_KEY` | Internal service auth key                | (required)                 |
| `INTAKE_ENCRYPTION_KEY`   | AES-256-CBC encryption key (64-char hex) | (required)                 |
| `REDIS_HOST`              | Redis host                               | `localhost`                |
| `REDIS_PORT`              | Redis port                               | `6379`                     |
| `REDIS_PASSWORD`          | Redis password                           | (optional)                 |
| `EVENTS_QUEUE_NAME`       | BullMQ queue name                        | `uvian-events`             |
| `SUBMISSION_EXPIRY_DAYS`  | Submission data expiry (days)            | `30`                       |
| `INTAKE_BASE_URL`         | Base URL for intake form links           | `https://intake.uvian.com` |

## API Endpoints

### Health

| Method | Path          | Description  |
| ------ | ------------- | ------------ |
| GET    | `/api/health` | Health check |

### Internal Routes (requires `authenticateInternal`)

| Method | Path                    | Description        |
| ------ | ----------------------- | ------------------ |
| POST   | `/api/intakes`          | Create intake form |
| GET    | `/api/intakes/:tokenId` | Get intake status  |
| DELETE | `/api/intakes/:tokenId` | Revoke intake      |

### Public Routes (no auth for basic ops)

| Method | Path                                    | Description                        |
| ------ | --------------------------------------- | ---------------------------------- |
| GET    | `/api/public/intakes/:tokenId`          | Get intake schema (410 if expired) |
| GET    | `/api/public/intakes/:tokenId/status`   | Get intake status                  |
| POST   | `/api/public/intakes/:tokenId/submit`   | Submit form data                   |
| GET    | `/api/public/submissions/:submissionId` | Get submission by ID               |

### MCP

| Method | Path      | Auth                | Description           |
| ------ | --------- | ------------------- | --------------------- |
| POST   | `/v1/mcp` | Bearer `sk_agent_*` | MCP server (12 tools) |
| GET    | `/v1/mcp` | None                | Returns 405           |

### MCP Tools (12 total)

`create_intake`, `get_intake_status`, `revoke_intake`, `list_intakes`, `get_submission`, `get_submissions_by_intake`, `generate_rsa_keypair`, `get_secret`, `list_secrets`, `delete_secret`, `decrypt_data`, `decrypt_submission`

## Database Schema

### `core_intake.intakes`

| Column          | Type        | Notes                                        |
| --------------- | ----------- | -------------------------------------------- |
| `id`            | TEXT (PK)   | `int_` + 21-char nanoid                      |
| `title`         | TEXT        | Form title                                   |
| `schema`        | JSONB       | Field definitions                            |
| `public_key`    | TEXT        | RSA public key for E2E encryption            |
| `status`        | TEXT        | `pending`, `completed`, `revoked`, `expired` |
| `expires_at`    | TIMESTAMPTZ | TTL expiration                               |
| `requires_auth` | BOOLEAN     | Auth required to submit                      |
| `submission_id` | TEXT        | Reference to completed submission            |

### `core_intake.submissions`

| Column         | Type        | Notes                                   |
| -------------- | ----------- | --------------------------------------- |
| `id`           | TEXT (PK)   | `sub_` + 21-char nanoid                 |
| `intake_id`    | TEXT (FK)   | Reference to intakes                    |
| `payload`      | JSONB       | Form data (encrypted for secret fields) |
| `submitted_at` | TIMESTAMPTZ | Submission timestamp                    |
| `expires_at`   | TIMESTAMPTZ | Data expiration                         |
| `submitted_by` | UUID        | User ID (if authenticated)              |

## Architecture

- **Plugin-based Fastify** with `@fastify/autoload`
- **E2E encryption** - RSA public key per intake, hybrid encryption for submissions
- **Multi-tier auth** - Supabase JWT, internal API key, agent API key (bcrypt + JWT cache)
- **Event-driven** - emits INTAKE_CREATED, INTAKE_COMPLETED, INTAKE_REVOKED via BullMQ
- **Discord identity linking** - special handling for `discord_link` metadata type
- **HTTP 410 Gone** for expired intakes
- **Lazy queue creation** - BullMQ queues created on-demand

## Commands

```bash
# Build
npx nx build uvian-intake-api

# Serve (development)
npx nx serve uvian-intake-api

# Test
npx nx test uvian-intake-api

# Lint
npx nx lint uvian-intake-api

# Typecheck
npx nx typecheck uvian-intake-api
```

## Deployment

Deployed on **Railway**.

- **Start command:** `npx nx run @org/uvian-intake-api:serve`
- **Health check:** `GET /api/health` (30s timeout)
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-intake-api/**`, `packages/uvian-events/**`, `nx.json`, `package.json`, `package-lock.json`, `tsconfig.base.json`
