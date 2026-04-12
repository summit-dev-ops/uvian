# uvian-automation-worker

Python background processing service that consumes jobs from a BullMQ/Redis queue and processes them through a LangGraph-powered AI agent. Handles event-driven automation with MCP tool integration and skill-based capabilities.

## Tech Stack

| Technology                 | Purpose                         |
| -------------------------- | ------------------------------- |
| **Python 3.14.2**          | Runtime                         |
| **Poetry**                 | Package management              |
| **BullMQ (Python)**        | Job queue consumer              |
| **Redis**                  | Queue backend + pub/sub         |
| **Supabase**               | PostgreSQL database             |
| **LangGraph**              | AI agent framework (StateGraph) |
| **LangChain**              | LLM orchestration               |
| **langchain-mcp-adapters** | MCP protocol integration        |
| **OpenAI SDK**             | LLM API client (via HF Router)  |
| **Jinja2**                 | Templating                      |
| **cryptography**           | Cryptographic operations        |
| **httpx**                  | HTTP client                     |
| **pytest**                 | Testing                         |
| **flake8**                 | Linting                         |

## Directory Structure

```
apps/uvian-automation-worker/
├── pyproject.toml                       # Poetry config + dependencies
├── poetry.lock                          # Locked dependencies
├── project.json                         # Nx project config
├── railway.toml                         # Railway deployment config
├── .env                                 # Environment variables
├── .flake8                              # Linting config (max-line-length=120)
├── tests/
│   ├── __init__.py
│   └── conftest.py
└── apps/uvian_automation_worker/
    ├── main.py                          # Entry point: BullMQ worker loop
    ├── core/
    │   ├── config.py                    # Centralized configuration
    │   ├── logging.py                   # WorkerLogger with job-context logging
    │   ├── events.py                    # EventsClient (Redis pub/sub)
    │   ├── db.py                        # Legacy database interface
    │   ├── dependency_injection.py      # DI Container + ExecutorFactory
    │   └── utils/
    │       └── naming.py                # camelCase <-> snake_case conversion
    ├── clients/
    │   ├── supabase.py                  # SupabaseClient singleton
    │   ├── config.py                    # get_agent_skills()
    │   ├── auth.py                      # get_agent_secrets()
    │   └── mcp.py                       # PersistentMCPClient + MCPRegistry
    ├── repositories/
    │   ├── jobs.py                      # JobRepository (core_automation.jobs)
    │   ├── checkpoints.py               # CheckpointRepository (LangGraph state)
    │   └── process_threads.py           # ProcessThreadRepository
    ├── executors/
    │   ├── base.py                      # BaseExecutor (ABC)
    │   ├── config.py                    # System message config
    │   ├── agent_executor.py            # AgentExecutor (main executor)
    │   └── triggers/
    │       ├── base.py                  # BaseTrigger + TriggerRegistry
    │       ├── message_trigger.py       # message.created, conversation.member_joined
    │       ├── ticket_trigger.py        # ticket.created, ticket.updated
    │       ├── content_trigger.py       # post.created, note.updated, asset.uploaded
    │       ├── space_trigger.py         # space.member_joined, space.created, etc.
    │       ├── job_trigger.py           # job.created, job.cancelled, job.retry
    │       ├── discord_trigger.py       # discord.message_created, discord.interaction_received
    │       └── schedule_trigger.py      # schedule.schedule_fired
    └── core/agents/
        ├── universal_agent/
        │   └── agent.py                 # build_agent(): LangGraph StateGraph
        └── utils/
            ├── state.py                 # MessagesState TypedDict
            ├── templates.py             # Jinja2 transcript template
            ├── tokens.py                # Token counting + context routing
            ├── skill_mapping.py         # Event-to-skill filtering
            ├── mcp_mapping.py           # Event-to-MCP filtering
            ├── models/
            │   └── base_models.py       # ChatOpenAI via HF Router
            ├── nodes/
            │   ├── model_node.py        # LLM call with dynamic tools
            │   ├── tool_node.py         # Tool execution (vendored)
            │   ├── throttle_node.py     # 2s rate limiting
            │   └── summarizer_node.py   # Context summarization
            ├── tools/
            │   ├── base_tools.py        # search_skills, load_skill, list_mcps, load_mcp
            └── memory/
                └── base_memory.py       # PostgresAsyncCheckpointer
```

## Environment Variables

| Variable                   | Purpose                   | Default                 |
| -------------------------- | ------------------------- | ----------------------- |
| `REDIS_HOST`               | Redis host                | `localhost`             |
| `REDIS_PORT`               | Redis port                | `6379`                  |
| `REDIS_PASSWORD`           | Redis password            | (optional)              |
| `REDIS_FAMILY`             | Redis database number     | `1`                     |
| `UVIAN_AUTOMATION_API_URL` | Automation API URL        | `http://localhost:3001` |
| `UVIAN_INTERNAL_API_KEY`   | Internal API key          | (required)              |
| `HF_TOKEN`                 | HuggingFace API token     | (required)              |
| `SUPABASE_URL`             | Supabase project URL      | (required)              |
| `SUPABASE_SECRET_KEY`      | Supabase service role key | (required)              |

## Job Processing Pipeline

```
API creates job in Supabase (core_automation.jobs)
    |
    v
API adds { jobId: "<uuid>" } to BullMQ "main-queue"
    |
    v
Worker picks up job (concurrency: 50)
    |
    v
Fetches full job record from Supabase
    |
    v
Determines job type -> resolves executor via DI container
    |
    v
Event jobs transformed to "agent" type
    |
    v
AgentExecutor processes:
  - Derives trigger message from TriggerRegistry
  - Fetches agent secrets (LLM config, MCP configs)
  - Fetches agent skills
  - Creates/uses process thread
  - Builds LangGraph agent with MCP tools + skills
  - Streams execution via astream(stream_mode="messages")
    |
    v
Updates job status to completed/failed
```

## LangGraph Agent Architecture

```
START -> check_context_node -> (summarize_node | model_node)
model_node -> (tool_node | END) [via tools_condition]
tool_node -> throttle_node -> model_node
```

| Node               | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| check_context_node | Routes to summarize if context too large (>7692 tokens)     |
| model_node         | LLM call with dynamic tools, skills, MCP integration        |
| tool_node          | Executes tool calls (base tools + MCP tools)                |
| throttle_node      | 2-second rate limit delay                                   |
| summarize_node     | Compresses old conversation history (keeps last 6 messages) |

### Agent Tools

- `search_skills` - List available skills
- `load_skill` - Load skill content into context
- `list_mcps` - List available MCP tool servers
- `load_mcp` - Dynamically load MCP server tools

### LLM Configuration

- **Model:** MiniMaxAI/MiniMax-M2.5 via HuggingFace Router
- **Temperature:** 0.6
- **Rate limit:** 0.4 req/s
- **Per-agent override** via secrets (model_name, base_url, api_key, temperature)

## Trigger Registry (17 event types)

| Trigger  | Events                                                                        |
| -------- | ----------------------------------------------------------------------------- |
| Message  | `message.created`, `conversation.member_joined`                               |
| Ticket   | `ticket.created`, `ticket.updated`                                            |
| Content  | `post.created`, `note.updated`, `asset.uploaded`                              |
| Space    | `space.member_joined`, `space.member_role_changed`, `space.created`           |
| Job      | `job.created`, `job.cancelled`, `job.retry`                                   |
| Discord  | `com.uvian.discord.message_created`, `com.uvian.discord.interaction_received` |
| Schedule | `com.uvian.schedule.schedule_fired`                                           |

## Architecture

- **Dependency Injection** - full DI container with ExecutorFactory, thread-safe singletons
- **Repository Pattern** - clean data access layer (jobs, checkpoints, process threads)
- **Trigger Registry** - decorator-based registration (`@TriggerRegistry.register("event.type")`)
- **Persistent MCP connections** via AsyncExitStack
- **PostgreSQL checkpointing** - custom PostgresAsyncCheckpointer for LangGraph state
- **Context window management** - automatic summarization at 8192 token threshold
- **Dual Redis** - BullMQ (db 0) + pub/sub events (db 1)

## Commands

```bash
# Install dependencies
poetry install --with dev

# Serve (run worker)
npx nx serve uvian-automation-worker

# Build
npx nx build uvian-automation-worker

# Test
npx nx test uvian-automation-worker
# or: poetry run pytest tests/

# Lint
npx nx lint uvian-automation-worker
# or: flake8 with max-line-length=120
```

## Deployment

Deployed on **Railway**.

- **Start command:** `cd apps/uvian-automation-worker && .venv/bin/python apps/uvian_automation_worker/main.py`
- **Restart policy:** `on_failure` (production), `always` (staging)
- **Watch patterns:** `apps/uvian-automation-worker/**`, `nx.json`
