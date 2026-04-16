# Uvian Intake API - Product Guide

## Overview

The **Uvian Intake API** is a Fastify-based backend service that handles ephemeral intake forms with end-to-end (E2E) encryption capabilities. It serves as the core API for collecting sensitive information from users through time-limited, secure forms that automatically expire after a specified duration.

### What is an Intake Form?

An **intake form** is a temporary, single-use form created to collect specific information from a user. Unlike traditional forms, intakes are:

- **Ephemeral**: Automatically expire after a configurable time period (default 1 hour, max 7 days)
- **Single-submission**: Only allow one submission per form
- **E2E Encrypted**: Sensitive fields can be encrypted using RSA public key cryptography
- **Optional Authentication**: Can require users to be logged in to submit

---

## Key Features and Capabilities

### 1. Ephemeral Form Management

- **Time-Limited Forms**: Forms automatically expire after a specified duration (60 seconds to 7 days)
- **Automatic Cleanup**: Expired forms return HTTP 410 Gone status
- **One-Time Submission**: Each form can only be submitted once
- **Revocation**: Form creators can manually revoke forms before expiration

### 2. End-to-End Encryption

The Intake API implements a **hybrid encryption scheme** for protecting sensitive form data:

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| Key Encryption | RSA-2048 (OAEP + SHA-256) | Encrypt the AES session key |
| Data Encryption | AES-256-GCM | Encrypt the actual form payload |
| Internal Storage | AES-256-CBC | Encrypt secrets in the database |

**Encryption Flow:**
1. The form creator generates an RSA keypair via the MCP tool
2. The RSA **public key** is stored with the intake form schema
3. When a user submits the form, sensitive fields are encrypted using the public key
4. Only the form creator (who holds the private key) can decrypt submissions

### 3. MCP Tools for AI Agents

The API exposes a comprehensive **Model Context Protocol (MCP)** interface with 12 tools that allow AI agents to programmatically manage intake forms:

| Tool | Description |
|------|-------------|
| `create_intake` | Create a new ephemeral intake form |
| `get_intake_status` | Check form status (pending/completed/revoked/expired) |
| `revoke_intake` | Manually revoke a form |
| `list_intakes` | List all intakes created by the user |
| `get_submission` | Retrieve a specific submission |
| `get_submissions_by_intake` | Get all submissions for an intake |
| `generate_rsa_keypair` | Generate RSA keypair for E2E encryption |
| `get_secret` | Retrieve a stored secret (private key) |
| `list_secrets` | List all secrets for the account |
| `delete_secret` | Delete a secret |
| `decrypt_data` | Decrypt data using RSA private key |
| `decrypt_submission` | Decrypt a complete submission |

### 4. Discord Identity Linking

A special **metadata type** (`discord_link`) enables linking Discord identities to Uvian user accounts:

- When a user submits a form with `discord_link` metadata
- The API automatically links their Discord user ID to their Uvian account
- This enables seamless Discord-based authentication and identity verification

### 5. Multi-Tier Authentication

The API supports multiple authentication methods:

| Auth Method | Use Case |
|-------------|----------|
| Internal API Key | Service-to-service communication |
| Supabase JWT | User authentication |
| Agent API Key (`sk_agent_*`) | AI agent MCP access with JWT caching |
| No Auth | Public intake form submission (optional) |

---

## User Value

### Why Do Users Care?

1. **Secure Sensitive Data Collection**: Collect passwords, API keys, or personal information without exposing it to the API server

2. **Time-Bound Workflows**: Create forms that must be completed within a specific window (e.g., onboarding tasks, verification steps)

3. **One-Click Discord Linking**: Easily link Discord accounts without requiring users to go through OAuth flows

4. **Agent Automation**: AI agents can autonomously create and manage intake forms for various use cases

5. **Automatic Expiration**: No need to manually clean up old forms - they expire automatically

### Key User Workflows

#### Workflow 1: Collect Sensitive Information

```typescript
// AI Agent creates an intake form to collect API keys
{
  "title": "API Key Submission",
  "fields": [
    { "name": "apiKey", "type": "password", "label": "API Key", "secret": true }
  ],
  "publicKey": "-----BEGIN PUBLIC KEY...",
  "expiresInSeconds": 3600
}
```

**Value**: The API key is encrypted on the client side - even if the database is compromised, the data is unreadable without the private key.

#### Workflow 2: Discord Account Linking

```typescript
// Create intake for Discord linking
{
  "title": "Link Discord Account",
  "metadata": {
    "type": "discord_link",
    "discordUserId": "123456789"
  },
  "requiresAuth": true
}
```

**Value**: Users can link their Discord account by submitting a simple form after logging in.

#### Workflow 3: Onboarding Task Assignment

```typescript
// Create a time-limited onboarding task
{
  "title": "Complete Profile",
  "expiresInSeconds": 86400, // 24 hours
  "subscriberIds": ["user-uuid-1", "user-uuid-2"]
}
```

**Value**: Assign time-bound tasks to users with automatic expiration reminders.

---

## Technical Architecture

### Framework and Key Libraries

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework with plugin-based architecture |
| **TypeScript** | Type safety throughout |
| **Supabase** | PostgreSQL database (core_intake schema) |
| **BullMQ** | Event queue for async processing |
| **Redis** | Queue backend |
| **MCP SDK** | Model Context Protocol server |
| **Zod** | Runtime validation for API inputs |
| **bcryptjs** | API key hashing |
| **@org/utils-encryption** | RSA/AES encryption utilities |
| **@org/uvian-events** | Typed event definitions |

### API Routes

#### Health Endpoint
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health check |

#### Internal Routes (Requires Internal Auth)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/intakes` | Create a new intake form |
| GET | `/api/intakes/:tokenId` | Get intake status |
| DELETE | `/api/intakes/:tokenId` | Revoke an intake |

#### Public Routes (No Auth Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/intakes/:tokenId` | Get intake schema (returns 410 if expired) |
| GET | `/api/public/intakes/:tokenId/status` | Get intake status |
| POST | `/api/public/intakes/:tokenId/submit` | Submit form data |
| GET | `/api/public/submissions/:submissionId` | Get submission by ID |

#### MCP Endpoint
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/mcp` | Bearer `sk_agent_*` | MCP server (12 tools) |
| GET | `/v1/mcp` | None | Returns 405 Method Not Allowed |

#### API Key Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/api-key` | Internal key or JWT | Create agent API key |
| DELETE | `/api/auth/api-key` | Internal key or JWT | Revoke agent API key |

### Database Schema

#### `core_intake.intakes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Format: `int_` + 21-char nanoid |
| `title` | TEXT | Form title |
| `description` | TEXT | Optional description |
| `submit_label` | TEXT | Submit button label (default: "Submit") |
| `public_key` | TEXT | RSA public key for E2E encryption |
| `schema` | JSONB | Field definitions |
| `metadata` | JSONB | Internal metadata |
| `status` | TEXT | `pending`, `completed`, `revoked`, `expired` |
| `expires_at` | TIMESTAMPTZ | TTL expiration timestamp |
| `created_by` | TEXT | User ID who created the intake |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `requires_auth` | BOOLEAN | Whether auth is required to submit |
| `submission_id` | TEXT | Reference to completed submission |

#### `core_intake.submissions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Format: `sub_` + 21-char nanoid |
| `intake_id` | TEXT (FK) | Reference to intake |
| `payload` | JSONB | Form data (encrypted for secret fields) |
| `submitted_at` | TIMESTAMPTZ | Submission timestamp |
| `expires_at` | TIMESTAMPTZ | Data expiration (default: 30 days) |
| `submitted_by` | UUID | User ID if authenticated |

### Event Types

The API emits typed events via BullMQ for downstream processing:

| Event | Description |
|-------|-------------|
| `com.uvian.intake.created` | Emitted when a new intake is created |
| `com.uvian.intake.completed` | Emitted when an intake is submitted |
| `com.uvian.intake.revoked` | Emitted when an intake is revoked |
| `com.uvian.intake.deleted` | Emitted when an intake is deleted |

---

## Integration Points

### How It Fits into the Platform

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Uvian Platform                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐  │
│  │ uvian-hub-api  │────▶│ uvian-intake-api │◀────│ AI Agents   │  │
│  │                 │     │                  │     │ (MCP)       │  │
│  └────────┬────────┘     └────────┬─────────┘     └─────────────┘  │
│           │                       │                                    │
│           │                       ▼                                    │
│           │              ┌──────────────────┐                         │
│           │              │ uvian-intake-web │                         │
│           │              │ (Next.js App)    │                         │
│           │              └──────────────────┘                         │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                 │
│  │ Supabase        │                                                 │
│  │ (PostgreSQL)   │                                                 │
│  └─────────────────┘                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Services It Depends On

| Service | Purpose |
|---------|---------|
| `@org/services-api-key` | API key management for agent authentication |
| `@org/services-accounts` | Account membership verification |
| `@org/services-secrets` | Secure storage of private keys |
| `@org/services-subscription` | User subscription/notification management |
| `@org/plugins-event-emitter` | Event emission via BullMQ |
| `@org/uvian-events` | Typed event definitions |

### How It Works with uvian-intake-web

The **uvian-intake-web** is the frontend Next.js application that renders intake forms:

1. User visits `https://intake.uvian.com/t/{tokenId}`
2. Frontend fetches the intake schema from `GET /api/public/intakes/:tokenId`
3. User fills out the form
4. Frontend encrypts sensitive fields using the RSA public key
5. Frontend submits to `POST /api/public/intakes/:tokenId/submit`
6. API stores the encrypted submission and updates intake status

### Discord Linking Flow

```
1. AI Agent creates intake with metadata.type = "discord_link"
2. User visits intake form
3. If requiresAuth = true, user logs in
4. User submits form
5. API checks metadata.type === "discord_link"
6. API links user's Discord ID to their Uvian account via user_identities table
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | No | `localhost` | Server bind address |
| `PORT` | No | `8001` | Server port |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | - | Supabase service role key |
| `SUPABASE_ANON_KEY` | Yes | - | Supabase anon key |
| `SUPABASE_JWT_SECRET` | Yes | - | JWT verification secret |
| `SECRET_INTERNAL_API_KEY` | Yes | - | Internal service auth key |
| `INTAKE_ENCRYPTION_KEY` | Yes | - | AES-256-CBC key (64-char hex) |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password |
| `EVENTS_QUEUE_NAME` | No | `uvian-events` | BullMQ queue name |
| `SUBMISSION_EXPIRY_DAYS` | No | `30` | Submission data retention |
| `INTAKE_BASE_URL` | No | `https://intake.uvian.com` | Form URL base |

---

## Deployment

The service is deployed on **Railway**:

- **Start Command**: `npx nx run @org/uvian-intake-api:serve`
- **Health Check**: `GET /api/health` (30s timeout)
- **Restart Policy**: `on_failure` (production), `always` (staging)
- **Port**: 8001

---

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

---

## Security Considerations

1. **E2E Encryption**: Sensitive fields are encrypted on the client side using RSA-2048
2. **Hybrid Encryption**: Uses RSA for key exchange + AES-256-GCM for data
3. **API Key Hashing**: Agent API keys are hashed with bcrypt before storage
4. **JWT Caching**: Agent JWTs are cached for 50 minutes to reduce auth overhead
5. **Automatic Expiration**: Forms and submissions auto-expire - no manual cleanup needed
6. **HTTP 410**: Expired forms return properGone status for cache-friendly behavior
