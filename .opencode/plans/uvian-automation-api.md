# Uvian Automation API

## Product Guide

The Uvian Automation API is the core backend service powering Uvian's Agent Collaboration and Orchestration Platform. Built on Fastify, this API handles all automation-related operations including job management, LLM provider configuration, MCP (Model Context Protocol) server management, skill definitions, webhook processing, and agent configuration.

---

## What is Uvian Automation API?

The Automation API is the orchestrator layer that enables autonomous agent systems to execute work, manage configurations, and integrate with external services. It serves as the central hub where users define their agent capabilities (LLMs, MCPs, Skills) and where jobs are queued for processing by the automation worker.

### Key Capabilities

| Capability | Description |
|-----------|------------|
| **Agent Configuration** | Define agent behavior through system prompts, conversation history limits, and custom config |
| **Job Management** | Create, track, cancel, retry, and delete automation jobs |
| **LLM Providers** | Configure multiple LLM providers (OpenAI, Anthropic, Ollama, etc.) per account |
| **MCP Servers** | Register and manage Model Context Protocol servers for agent capabilities |
| **Skills** | Define reusable skill modules that agents can execute |
| **Secrets Management** | Securely store API keys, tokens, and other sensitive credentials |
| **Webhooks** | Process incoming webhook events and trigger agent wake-up |
| **Tickets** | Create and manage support/automation tickets |
| **MCP Tools** | Expose a comprehensive MCP server with tools for agent self-management |

---

## User Value

### Why Users Care About the Automation API

1. **Unified Configuration**: All agent settings (LLMs, MCPs, Skills) are managed in one place
2. **Job Visibility**: Users can track job status, retry failed jobs, and view job output
3. **Secure Secrets**: API keys and credentials are encrypted and managed securely
4. **Event-Driven Automation**: Webhooks trigger agents to respond to external events
5. **MCP Self-Service**: Agents can self-configure via the MCP tools

### Primary User Workflows

#### 1. Initialize an Agent

When a user creates an account, the system initializes an agent with default configuration:

```bash
POST /api/agents/init
{
  "user_id": "user_123",
  "account_id": "acc_456",
  "api_key": "sk_live_...",
  "api_key_prefix": "sk_agent_"
}
```

This creates:
- An agent record in the database
- An encrypted API key secret
- A "Uvian Hub" MCP linked to the agent
- System MCPs for each Uvian service

#### 2. Configure LLM Providers

```bash
# Add an LLM
POST /api/config/llms
{
  "accountId": "acc_456",
  "name": "OpenAI GPT-4",
  "type": "chat",
  "provider": "openai",
  "modelName": "gpt-4-turbo",
  "temperature": 0.7,
  "maxTokens": 4000
}

# Link to agent
POST /api/config/agents/:agentId/llms
{
  "llmId": "llm_789",
  "isDefault": true
}
```

#### 3. Create and Manage Jobs

```bash
# Create a job
POST /api/jobs
{
  "type": "thread-wakeup",
  "input": { "threadId": "thread_123" }
}

# List jobs
GET /api/jobs?status=queued&type=thread-wakeup

# Cancel a job
PATCH /api/jobs/:id/cancel

# Retry a failed job
PATCH /api/jobs/:id/retry
```

#### 4. Define Skills

```bash
POST /api/config/skills
{
  "accountId": "acc_456",
  "name": "Summarize Content",
  "description": "Summarizes lengthy content into key points",
  "content": {
    "prompt": "Summarize the following: {{content}}",
    "maxPoints": 5
  },
  "autoLoadEvents": ["content.created"]
}
```

#### 5. Process Webhooks

```bash
POST /api/webhooks/agents/:agentId/events
Authorization: Bearer <agent-api-key>
Content-Type: application/cloudevents+json

{
  "specversion": "1.0",
  "type": "github.pull_request",
  "source": "https://github.com/user/repo",
  "id": "event_123",
  "data": {
    "action": "opened",
    "pull_request": { "title": "Fix bug" }
  }
}
```

---

## Technical Documentation

### Framework & Dependencies

| Component | Technology |
|-----------|------------|
| **Framework** | Fastify |
| **Database** | Supabase (PostgreSQL) |
| **Queue** | BullMQ + Redis |
| **MCP Server** | @modelcontextprotocol/sdk |
| **Auth** | JWT + bcrypt |
| **Encryption** | RSA, AES |

### Key Libraries

```json
{
  "fastify": "^5.x",
  "@fastify/autoload": "^5.x",
  "@fastify/cors": "^5.x",
  "@modelcontextprotocol/sdk": "^1.x",
  "@supabase/supabase-js": "^2.x",
  "bullmq": "^5.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "zod": "^3.x"
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key for admin operations |
| `REDIS_URL` | Yes | Redis connection URL |
| `SECRET_INTERNAL_API_KEY` | Yes | Encryption secret |
| `SUPABASE_JWT_SECRET` | Yes | JWT signing secret |
| `PORT` | No | Server port (default: 3001) |
| `HOST` | No | Server host (default: localhost) |

---

## API Routes Overview

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/register` | Register new user |

### Agent Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/init` | Initialize new agent |
| GET | `/api/config/agents/:agentUserId` | Get agent config |
| POST | `/api/config/agents` | Create agent |
| PUT | `/api/config/agents/:agentId` | Update agent |
| GET | `/api/agents/:agentUserId/secrets` | Get agent secrets |
| GET | `/api/agents/:agentUserId/skills` | Get agent skills |

### Job Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Get job |
| PATCH | `/api/jobs/:id/cancel` | Cancel job |
| PATCH | `/api/jobs/:id/retry` | Retry job |
| DELETE | `/api/jobs/:id` | Delete job |
| GET | `/api/jobs/usage` | Get jobs usage |

### LLM Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/llms/:accountId` | List LLMs |
| POST | `/api/config/llms` | Create LLM |
| PUT | `/api/config/llms/:llmId` | Update LLM |
| DELETE | `/api/config/llms/:llmId` | Delete LLM |

### MCP Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/mcps/:accountId` | List MCPs |
| POST | `/api/config/mcps` | Create MCP |
| PUT | `/api/config/mcps/:mcpId` | Update MCP |
| DELETE | `/api/config/mcps/:mcpId` | Delete MCP |

### Skill Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/skills/:accountId` | List skills |
| POST | `/api/config/skills` | Create skill |
| PUT | `/api/config/skills/:skillId` | Update skill |
| DELETE | `/api/config/skills/:skillId` | Delete skill |

### Secrets Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/secrets/:accountId` | List secrets |
| POST | `/api/config/secrets` | Create secret |
| PUT | `/api/config/secrets/:secretId` | Update secret |
| DELETE | `/api/config/secrets/:secretId` | Delete secret |

### Agent Resource Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/config/agents/:agentId/llms` | Link LLM to agent |
| PUT | `/api/config/agents/:agentId/llms/:llmId` | Update LLM link |
| DELETE | `/api/config/agents/:agentId/llms/:llmId` | Unlink LLM |
| POST | `/api/config/agents/:agentId/mcps` | Link MCP to agent |
| PUT | `/api/config/agents/:agentId/mcps/:mcpId` | Update MCP link |
| DELETE | `/api/config/agents/:agentId/mcps/:mcpId` | Unlink MCP |
| GET | `/api/config/agents/:agentId/skills` | Get agent skills |
| POST | `/api/config/agents/:agentId/skills` | Link skill to agent |
| DELETE | `/api/config/agents/:agentId/skills/:skillId` | Unlink skill |

### Ticket Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets` | List tickets |
| GET | `/api/tickets/:id` | Get ticket |
| PATCH | `/api/tickets/:id` | Update ticket |
| POST | `/api/tickets/:id/resolve` | Resolve ticket |
| POST | `/api/tickets/:id/assign` | Assign ticket |
| DELETE | `/api/tickets/:id` | Delete ticket |

### Webhook Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/agents/:agentId/events` | Process webhook event |
| GET | `/api/webhooks/health` | Health check |

### MCP Server Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/mcp` | MCP server (stateless) |
| GET | `/v1/mcp` | Returns 405 (use POST) |

---

## MCP Tools Exposed

The Automation API exposes a comprehensive MCP server at `/v1/mcp`. Agents can use these tools for self-configuration:

### Secrets Tools

| Tool | Description |
|------|-------------|
| `generate_rsa_keypair` | Generate RSA key pair and store private key as secret |
| `get_secret` | Retrieve secret by ID with decrypted value |
| `list_secrets` | List all secrets for account |
| `delete_secret` | Delete a secret |
| `decrypt_data` | Decrypt ciphertext using stored RSA private key |

### Agent Config Tools

| Tool | Description |
|------|-------------|
| `create_agent_config` | Create agent configuration |
| `get_agent_config` | Get agent configuration by ID |
| `update_agent_config` | Update agent configuration |
| `get_agent_llms` | Get LLMs linked to agent |
| `get_agent_mcps` | Get MCPs linked to agent |
| `get_agent_skills` | Get skills linked to agent |

### LLM Tools

| Tool | Description |
|------|-------------|
| `list_llms` | List all LLMs for account |
| `get_llm` | Get LLM by ID |
| `create_llm` | Create new LLM |
| `link_llm` | Link LLM to agent |
| `unlink_llm` | Unlink LLM from agent |

### MCP Tools

| Tool | Description |
|------|-------------|
| `list_mcps` | List all MCPs for account |
| `get_mcp` | Get MCP by ID |
| `create_mcp` | Create new MCP |
| `link_mcp` | Link MCP to agent |
| `unlink_mcp` | Unlink MCP from agent |

### Skill Tools

| Tool | Description |
|------|-------------|
| `create_skill` | Create new skill |
| `list_skills` | List all skills for account |
| `get_skill` | Get skill by ID |
| `update_skill` | Update skill |
| `delete_skill` | Delete skill |
| `link_skill` | Link skill to agent |
| `unlink_skill` | Unlink skill from agent |

### Memory Tools

| Tool | Description |
|------|-------------|
| `set_agent_memory` | Store key-value data in agent shared memory |
| `get_agent_memory` | Retrieve value from agent memory |
| `list_agent_memory_keys` | List all memory keys for agent |

---

## CloudEvents Emitted

The Automation API emits CloudEvents for various state changes:

### Skill Events

| Event | Data |
|-------|------|
| `skill.created` | `{ accountId, skillId, name, createdBy }` |
| `skill.updated` | `{ accountId, skillId, name, updatedBy }` |
| `skill.deleted` | `{ accountId, skillId, deletedBy }` |
| `skill.linked` | `{ agentId, skillId, linkedBy }` |
| `skill.unlinked` | `{ agentId, skillId, unlinkedBy }` |

### Agent Events

| Event | Data |
|-------|------|
| `agent.created` | `{ accountId, agentId, name, createdBy }` |
| `agent.updated` | `{ agentId, updatedBy, config }` |
| `agent.deleted` | `{ accountId, agentId, deletedBy }` |
| `agent.activated` | `{ agentId, activatedBy }` |
| `agent.deactivated` | `{ agentId, deactivatedBy }` |

---

## Database Schema

The Automation API uses the following main tables in the `core_automation` schema:

### Core Tables

| Table | Description |
|-------|-------------|
| `agents` | Agent configurations |
| `jobs` | Automation jobs |
| `llms` | LLM provider configurations |
| `mcps` | MCP server configurations |
| `skills` | Skill definitions |
| `secrets` | Encrypted secrets |
| `agent_llms` | Agent-LLM links |
| `agent_mcps` | Agent-MCP links |
| `agent_skills` | Agent-skill links |
| `thread_inbox` | Event inbox for threads |
| `agent_shared_memory` | Agent key-value memory |
| `scheduled_tasks` | Scheduled task definitions |

### Public Schema Tables

| Table | Description |
|-------|-------------|
| `secrets` | User secrets |
| `agent_api_keys` | Agent API keys |
| `external_platforms` | External platform configs |

---

## Integration Points

### uvian-automation-worker

The Automation API queues jobs to BullMQ for processing by the automation worker:

```
API creates job in DB --> API adds to BullMQ queue --> Worker picks up job --> Worker processes --> Worker updates job status
```

### Webhook Flow

```
External Service --> POST to /api/webhooks/agents/:agentId/events 
--> API validates event 
--> API stores in thread_inbox 
--> API creates job 
--> API adds to queue 
--> Worker processes
```

### Agent Provisioning

```
1. POST /api/agents/init
   |
   v
2. Create agent record (agents table)
   |
   v
3. Encrypt and store API key (secrets table)
   |
   v
4. Create Uvian Hub MCP (mcps table)
   |
   v
5. Link MCP to agent (agent_mcps table)
   |
   v
6. Configure system MCPs (configureAgent service)
   |
   v
7. Return agent config with MCPs
```

---

## Authentication

### API Key Authentication

Agents authenticate via API keys prefixed with `sk_agent_`:

```bash
curl -H "Authorization: Bearer sk_agent_xxxx..." https://api.example.com/v1/mcp
```

### JWT Authentication

Users authenticate via Supabase JWT:

```bash
curl -H "Authorization: Bearer <jwt>" https://api.example.com/api/jobs
```

### Webhook Authentication

Webhooks use a signature-based auth:

```bash
curl -H "X-Webhook-Signature: <signature>" https://api.example.com/api/webhooks/agents/:id/events
```

---

## Error Handling

### Service Layer Errors

Services throw errors with descriptive messages:

```typescript
if (error) throw new Error(error.message);
```

### Route Handler Errors

Route handlers catch and return appropriate HTTP responses:

```typescript
try {
  const result = await jobService.scoped(clients).createJob(payload);
  reply.code(201).send(result);
} catch (error: any) {
  reply.code(400).send({ error: 'Failed to create job' });
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

---

## Running the API

### Development

```bash
npx nx serve uvian-automation-api
```

### Production Build

```bash
npx nx build uvian-automation-api
```

### Environment

```bash
export PORT=3001
export HOST=0.0.0.0
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_KEY=xxx
export REDIS_URL=redis://localhost:6379
export SECRET_INTERNAL_API_KEY=xxx
export SUPABASE_JWT_SECRET=xxx
```
