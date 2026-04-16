# Uvian Automation Worker - Product Guide

The Uvian Automation Worker is a Python-based background processing service that serves as the execution engine for Uvian's AI agent system. It consumes automation jobs from a Redis-backed queue and processes them through LangGraph-powered AI agents that can execute MCP tools and loaded skills.

## Overview

Uvian is an Agent Collaboration & Orchestration Platform. The automation worker is the computational core that actually performs actions on behalf of AI agents. When a user or system triggers an event (a message, ticket update, Discord interaction), the worker picks up the corresponding job and uses a LangGraph agent to process it intelligently.

## Product Value

### Why Users Care

| User Need | How Worker Addresses It |
|----------|-------------------|
| Automated responses to messages | Worker processes message events and generates AI responses |
| Multi-platform integration | MCP tool adapters connect to Discord, Supabase, and custom services |
| Stateful conversations | Thread-based context persists across interactions |
| Custom agent behaviors | Skills provide specialized handling patterns |
| Scalable processing | 50 concurrent jobs handled simultaneously |

### Key Capabilities

1. **Event-Driven Processing**: Automatically responds to 17 different event types from across the platform
2. **MCP Tool Integration**: Dynamically loads and executes tools from MCP (Model Context Protocol) servers
3. **Skill-Based Behavior**: Loads specialized skills that modify agent handling patterns
4. **Stateful Threads**: Maintains conversation context across multiple interactions
5. **Checkpoint Persistence**: Saves agent state to PostgreSQL for recovery and resumption

## Architecture

### High-Level Data Flow

```
                    +---------------------+
                    |  Uvian Automation   |
                    |       API         |
                    +--------+----------+
                             |
                             | Creates job in Supabase
                             | Adds jobId to BullMQ queue
                             v
                    +---------------------+
                    |  BullMQ Queue      |
                    |   (Redis)        |
                    +--------+----------+
                             |
                             | Worker picks up job
                             | (50 concurrent)
                             v
+---------------------------------------------------------------+
|                    Worker Process                              |
|  +-------------+    +---------------------+                    |
|  |   Fetch     |-->|  Determine Job     |                    |
|  | Job from    |   |  Type             |                    |
|  | Supabase   |   +--------+----------+                    |
|  +-------------+             |                            |
|                           v                            |
|  +----------------------------------+                  |
|  |      Executor Resolution          |                  |
|  |  (via Dependency Injection)    |                  |
|  +--------+------------------+-----+                  |
|           |                  |                       |
|           v                  v                       |
|  +-----------------+  +-------------+            |
|  |  Transform to   |  | Thread     |            |
|  |  Agent Job     |  | Wakeup     |            |
|  +------+---------+  +------+------+            |
|         |                 |                    |
|         +--------+--------+                    |
|                  v                          |
|  +--------------------------------+    |
|  |   AgentExecutor              |    |
|  | (LangGraph Agent)             |    |
|  +--------+-----------------+    |
|           |                     |
|           v                     |
|  +------------------+          |
|  |  Update Job to   |          |
|  | Completed/Failed |          |
|  +------------------+          |
+-----------------------------------------------------------+
```

### Supported Event Types

The worker handles 17 event types across 7 categories:

| Category | Events | Description |
|----------|-------|------------|
| **Message** | `com.uvian.message.created`, `com.uvian.conversation.member_joined` | Internal messages and conversation joins |
| **Ticket** | `com.uvian.ticket.created`, `com.uvian.ticket.updated` | Support ticket lifecycle |
| **Content** | `com.uvian.post.created`, `com.uvian.note.updated`, `com.uvian.asset.uploaded` | Content creation and updates |
| **Space** | `com.uvian.space.member_joined`, `com.uvian.space.member_role_changed`, `com.uvian.space.created` | Space/workspace events |
| **Job** | `com.uvian.job.created`, `com.uvian.job.cancelled`, `com.uvian.job.retry` | Automation job events |
| **Discord** | `com.uvian.discord.message_created`, `com.uvian.discord.interaction_received` | Discord bot events |
| **Schedule** | `com.uvian.schedule.schedule_fired` | Scheduled trigger events |

### Job Processing Pipeline

1. **Job Receipt**: Worker picks up job from BullMQ queue with `{ jobId: "<uuid>" }`
2. **Job Fetch**: Retrieves full job record from Supabase `core_automation.jobs` table
3. **Type Determination**: Checks job type (event-based jobs transform to "agent" type)
4. **Executor Resolution**: Uses dependency injection to find appropriate executor
5. **Execution**: Runs the job through executor (AgentExecutor for agent jobs)
6. **State Update**: Updates job status to `completed` or `failed`

## Technical Deep Dive

### Tech Stack

| Technology | Purpose |
|------------|--------|
| **Python 3.14** | Runtime |
| **Poetry** | Package management |
| **BullMQ (Python)** | Job queue consumer |
| **Redis** | Queue backend + pub/sub |
| **Supabase** | PostgreSQL database |
| **LangGraph** | AI agent framework (StateGraph) |
| **LangChain** | LLM orchestration |
| **langchain-mcp-adapters** | MCP protocol integration |
| **httpx** | HTTP client |
| **pytest** | Testing |

### Core Modules

```
apps/uvian_automation_worker/
+-- main.py                          # Entry point: BullMQ worker loop
+-- core/
|   +-- config.py                   # Environmental configuration
|   +-- logging.py                 # Structured logging with job context
|   +-- events.py                  # Redis pub/sub events
|   +-- dependency_injection.py    # DI container + executor factory
|   +-- utils/
|       +-- naming.py               # camelCase <-> snake_case
+-- clients/
|   +-- supabase.py                # Database client singleton
|   +-- config.py                  # get_agent_skills()
|   +-- auth.py                    # get_agent_secrets() from API
|   +-- mcp.py                     # PersistentMCPClient + MCPRegistry
|   +-- skills.py                  # Built-in skills definitions
+-- repositories/
|   +-- jobs.py                    # Job CRUD operations
|   +-- checkpoints.py             # LangGraph state persistence
|   +-- process_threads.py         # Thread management
|   +-- thread_inbox.py           # Pending messages per thread
|   +-- agent_memory.py           # Agent shared memory
+-- executors/
|   +-- base.py                   # BaseExecutor ABC
|   +-- agent_executor.py         # Main agent executor
+-- core/agents/
    +-- universal_agent/
    |   +-- agent.py              # build_agent(): LangGraph StateGraph
    +-- utils/
        +-- state.py              # MessagesState TypedDict
        +-- loader.py             # Event transformation
        +-- skill_mapping.py      # Event -> skill filtering
        +-- mcp_mapping.py       # Event -> MCP filtering
        +-- nodes/
        |   +-- sync_node.py     # State synchronization
        |   +-- model_node.py   # LLM calls
        |   +-- tool_node.py    # Tool execution
        |   +-- throttle_node.py # Rate limiting
        +-- tools/
        |   +-- base_tools.py   # search_skills, load_skill, list_mcps, load_mcp
        +-- memory/
            +-- base_memory.py   # PostgresAsyncCheckpointer
```

### LangGraph Agent Architecture

The core agent is a LangGraph StateGraph with the following structure:

```
START 
    |
    v
+-------------------+
|   sync_node       | --> Fetches pending messages from inbox
|   (synchronize)  | --> Transforms events to messages
|                  | --> Loads MCPs & skills dynamically
|                  | --> Fetches agent memory
+--------+----------+
         |
         v
+------------------+
|  check_context   | --> Routes based on token count
|  (conditional)  |    (>8192 tokens -> compaction_node)
+--------+-------+   |
         |        v
         |   +------------------+
         |   | compaction_node  | --> Summarizes old messages
         |   | (compress)      | --> Keeps last 6 messages
         |   +--------+---------+
         |        |
         |        v
         +------>|  model_node    | --> LLM call with tools
                 +-------+--------+
                         |
                         v
              +-------------------+
              |  tools_condition  |
              |  (conditional) | --> Has tool_calls -> tool_node
              +--------+--------+     |
                       |          v
                       |    +-------------------+
                       |    |   tool_node      | --> Execute tools
                       |    |   (execute)    |
                       +--->|                |
                            +--------+--------+
                                    |
                                    v
                            +------------------+
                            |  END          |
                            +------------------+
```

#### Node Functions

| Node | Responsibility |
|------|---------------|
| **sync_node** | Fetches pending messages, transforms events, loads MCPs/skills, retrieves agent memory |
| **check_context** | Routes to summarization if context window > 8192 tokens |
| **compaction_node** | Compresses conversation history, keeps last 6 messages |
| **model_node** | Invokes LLM with dynamic tool set |
| **tool_node** | Executes tool calls (base tools + MCP tools) |
| **throttle_node** | 2-second rate limit delay between iterations |

### Agent State (MessagesState)

The LangGraph agent maintains state through a TypedDict:

```python
class MessagesState(TypedDict):
    messages: Annotated[List[AnyMessage], operator.add]  # Conversation history
    llm_calls: int              # Number of LLM invocations
    agent_name: str            # Agent identifier
    transcript: str            # Full conversation transcript
    response_message_id: str  # Last response message ID
    custom_instructions: str    # Agent-specific instructions
    channel_id: str           # Output channel
    loaded_skills: List[Dict]  # Currently loaded skills
    loaded_mcps: List[Dict]    # Currently loaded MCPs
    available_skills: List[Dict]  # All available skills
    available_mcps: List[Dict]   # All available MCPs
    conversation_id: str       # Conversation thread
    agent_profile_id: str     # Agent profile
    message_id: str            # Current message
    event_metadata: Dict       # Event context
    thread_id: str            # Process thread
    execution_id: str         # Unique execution ID
    agent_memory: Dict        # Agent persistent memory
    compaction_state: Dict   # Summarization state
    session_context_size: int # Token count
    tokens_used: int          # Total tokens consumed
```

### MCP Integration

#### PersistentMCPClient

Manages persistent connections to MCP servers:

```python
class PersistentMCPClient:
    # Registers server configs (URL, auth) without connecting
    def register_all(mcp_configs: list):
        """Pre-register all MCPs, defer connection"""
    
    # Connect to specific servers when needed
    async def connect_and_load(mcp_ids_or_names: list[str]):
        """Lazily connect to needed MCPs"""
    
    # Load tools from a connected server
    async def load_tools(mcp_id: str) -> List[BaseTool]:
        """Fetch tools from MCP server"""
```

#### MCP Tools Available to Agent

The agent has 4 base tools for MCP management:

1. **search_skills** - List available skills by query
2. **load_skill** - Load skill content into context
3. **list_mcps** - List available MCP servers
4. **load_mcp** - Dynamically load MCP server tools

### Skill System

Skills are predefined behavioral patterns that modify agent handling. 5 built-in skills:

| Skill | Description |
|-------|-------------|
| **casual_rp_partner** | Collaborative roleplay with "Yes, and..." philosophy |
| **vibe_matcher** | Matches chat energy, punctuation, emoji usage |
| **internet_slang_translator** | Decodes modern slang and meme culture |
| **drama_deescalator** | Handles chat drama with chill language |
| **hype_man** | High-energy supportive reactions |

Skills are loaded dynamically based on event type matching.

### Checkpointing and Persistence

The worker uses a custom PostgreSQL checkpointer for LangGraph state:

```
+-------------------------------------------------------+
|         Checkpoint Flow                              |
+-------------------------------------------------------+
| 1. Agent runs and produces checkpoint                |
|    (serialized via JsonPlusSerializer)             |
|                                                       |
| 2. Serialize -> msgpack bytes                       |
|                                                       |
| 3. Convert to PostgreSQL hex format               |
|    ("\\x<hex>")                                    |
|                                                       |
| 4. Insert to agent_checkpoints                     |
|    table in Supabase                               |
|                                                       |
| 5. On resume: fetch checkpoint                      |
|    -> deserialize -> restore state                 |
+-------------------------------------------------------+
```

Thread state also persists:
- **process_threads**: Thread metadata and status
- **thread_inbox**: Pending messages per thread
- **agent_shared_memory**: Long-term agent memory

## Integration Points

### With Uvian Automation API

The worker fetches configuration from the API:

```python
# Via clients/auth.py
async def get_agent_secrets(agent_user_id: str) -> dict:
    """Fetch LLM configs, MCP configs from automation-api"""
    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/secrets"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}
```

The API provides:
- LLM configurations (model, base_url, api_key, temperature)
- MCP server configurations (URLs, auth methods, credentials)
- Per-agent customization

### With Supabase Database

| Table | Purpose |
|-------|---------|
| **core_automation.jobs** | Job queue and status |
| **core_automation.process_threads** | Thread metadata |
| **core_automation.thread_inbox** | Pending messages |
| **core_automation.agent_checkpoints** | LangGraph state |
| **core_automation.agent_shared_memory** | Agent memory |

### Job Receipt from Queue

```
+------------------------------------------+
|          Job Flow (Worker)            |
+------------------------------------------+
| 1. API creates job: INSERT to jobs   |
|                                       |
| 2. API adds to queue:                 |
|    QUEUE.add({ jobId: "<uuid>" })    |
|                                       |
| 3. Worker picks up: BullMQ consumer  |
|                                       |
| 4. Fetch full record:                  |
|    job_repository.get_job(job_id)     |
|                                       |
| 5. Resolve executor via DI           |
|                                       |
| 6. Execute and update status         |
+------------------------------------------+
```

### Event Transformers

Events from various sources are transformed into AI-readable messages:

```
Raw Event (com.uvian.message.created)
         |
         v
+-------------------+
| EventTransformer  | --> Parses event payload
| Registry         | --> Creates EventMessage
+--------+----------+
         |
         v
+-------------------+
|  HumanMessage    | --> "Event: com.uvian.message.created"
|  (for Agent)    |     Actor: user_123
|                |     Content: "Hello"
+-------------------+
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | (none) |
| `REDIS_FAMILY` | Redis database | `1` |
| `UVIAN_AUTOMATION_API_URL` | API URL | `http://localhost:3001` |
| `UVIAN_INTERNAL_API_KEY` | Internal API key | (required) |
| `HF_TOKEN` | HuggingFace token | (required) |
| `SUPABASE_URL` | Supabase URL | (required) |
| `SUPABASE_SECRET_KEY` | Supabase key | (required) |

### Worker Settings

```python
# core/config.py
WORKER_CONCURRENCY = 50    # Concurrent jobs
QUEUE_NAME = "main-queue"  # BullMQ queue name
```

## Deployment

- **Platform**: Railway
- **Start command**: `python apps/uvian_automation_worker/main.py`
- **Restart policy**: `on_failure` (production), `always` (staging)

## Commands

```bash
# Install dependencies
poetry install --with dev

# Run worker (serve)
npx nx serve uvian-automation-worker

# Test
npx nx test uvian-automation-worker

# Lint
npx nx lint uvian-automation-worker
```

## Summary

The Uvian Automation Worker is the execution engine that powers AI agent automation across the platform. It receives event-driven jobs from a queue, processes them through LangGraph agents capable of using MCP tools and loaded skills, maintains stateful conversation threads, and persists checkpoint state for recovery. This enables truly autonomous AI agents that can respond to messages, handle tickets, integrate with external services, and maintain persistent memory across interactions.
