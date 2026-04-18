# SPEC: Ticket System Work Distribution & MCP Tools

## 1. Goal

Add ticket management MCP tools to automation-api, and enable agents to distribute work to other agents using the ticket system.

---

## 2. Context

**Existing ticket system:**

- Table: `core_automation.tickets` with status workflow
- API: Full CRUD in `uvian-automation-api`
- Subscriptions: auto-created on create and assign
- Events: `ticket_created`, `ticket_assigned`, `ticket_resolved`

**Existing MCP in automation-api:**

- 29 tools for secrets, agents, LLMs, MCPs, skills, memory
- Located in `mcp.plugin.ts`
- Uses `@modelcontextprotocol/sdk`

---

## 3. Requirements

| #   | Requirement             | Description                                    |
| --- | ----------------------- | ---------------------------------------------- |
| 3.1 | Add ticket MCP tools    | 7 tools for ticket CRUD                        |
| 3.2 | Work distribution       | Agent creates ticket, assigns to another agent |
| 3.3 | Bootstrap config        | Use description JSON for work + bootstrap      |
| 3.4 | Worker resume on ticket | Agent wakes up on ticket assignment            |

---

## 4. MCP Ticket Tools

**File**: `apps/uvian-automation-api/src/app/plugins/mcp.plugin.ts`

Add these tools to `createAuthenticatedServer()`:

### 4.1 create_ticket

```typescript
server.registerTool(
  'create_ticket',
  {
    inputSchema: z.object({
      threadId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      assignedTo: z.string().optional(),
    }),
  },
  async (args): Promise<ToolResult> => {
    try {
      const result = await ticketService
        .scoped({ adminClient: adminSupabase, userClient: adminSupabase })
        .create(args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error}` }],
        isError: true,
      };
    }
  },
);
```

### 4.2 list_tickets

```typescript
server.registerTool(
  'list_tickets',
  {
    inputSchema: z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Returns { tickets: [...], total, page, limit, hasMore }
  },
);
```

### 4.3 get_ticket

```typescript
server.registerTool(
  'get_ticket',
  {
    inputSchema: z.object({
      ticketId: z.string(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Returns ticket or null
  },
);
```

### 4.4 update_ticket

```typescript
server.registerTool(
  'update_ticket',
  {
    inputSchema: z.object({
      ticketId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Updates and returns ticket
  },
);
```

### 4.5 resolve_ticket

```typescript
server.registerTool(
  'resolve_ticket',
  {
    inputSchema: z.object({
      ticketId: z.string(),
      resolutionPayload: z.record(z.string(), z.unknown()).optional(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Sets status=resolved, emits ticket_resolved event
  },
);
```

### 4.6 assign_ticket

```typescript
server.registerTool(
  'assign_ticket',
  {
    inputSchema: z.object({
      ticketId: z.string(),
      assignedTo: z.string().nullable(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Assigns and creates subscription for assigned user
  },
);
```

### 4.7 delete_ticket

```typescript
server.registerTool(
  'delete_ticket',
  {
    inputSchema: z.object({
      ticketId: z.string(),
    }),
  },
  async (args): Promise<ToolResult> => {
    // Returns { success: true }
  },
);
```

---

## 5. Work Distribution Flow

### 5.1 Ticket Description JSON Format

```json
{
  "work_description": "Process customer refund",
  "bootstrap_config": {
    "mcp_names": ["payment_api", "customer_db"],
    "skill_names": ["refund_handler"]
  }
}
```

Fields:

- `work_description` (required): What work needs to be done
- `bootstrap_config` (optional): { mcp_names: string[], skill_names: string[] }

### 5.2 Agent Creates Ticket

```python
# Agent A creates ticket
await create_ticket(
    threadId="thread_123",
    title="Process refund for order #456",
    description=json.dumps({
        "work_description": "Analyze return request, process refund via payment API",
        "bootstrap_config": {
            "mcp_names": ["payment_api"],
            "skill_names": ["refund_processor"]
        }
    })
)

# Agent A assigns to Agent B
await assign_ticket(ticketId="ticket_789", assignedTo="agent_b_user_id")
```

### 5.3 Worker Resume on Ticket

When worker processes ticket assignment:

1. Fetch ticket details
2. Parse `description` as JSON
3. Extract `bootstrap_config` if present
4. Resolve `mcp_names` to MCP configs via API
5. Resolve `skill_names` to skills via API
6. Load into agent config
7. Execute work

---

## 6. Worker Implementation

### 6.1 agent_executor.py Changes

```python
async def _execute_ticket_wakeup(self, job_data: JobData, inputs: dict):
    ticket_id = inputs.get("ticketId")
    agent_user_id = inputs.get("agentId")

    # Fetch ticket details
    ticket = await get_ticket(ticket_id)

    # Parse description JSON
    description_json = json.loads(ticket.description or "{}")
    work_description = description_json.get("work_description")
    bootstrap_config = description_json.get("bootstrap_config", {})

    # Resolve mcp_names to configs
    mcp_configs = []
    if bootstrap_config.get("mcp_names"):
        mcp_configs = await get_mcps_by_names(
            bootstrap_config["mcp_names"],
            agent_user_id
        )

    # Resolve skill_names to skills
    skills = []
    if bootstrap_config.get("skill_names"):
        skills = await get_skills_by_names(
            bootstrap_config["skill_names"],
            agent_user_id
        )

    # Build agent with bootstrap config
    # ... execute agent ...
```

### 6.2 agent.py Changes

```python
def build_agent(
    llm_config: Optional[Dict[str, Any]] = None,
    mcp_registry: Optional[MCPRegistry] = None,
    checkpointer=None,
    hooks: Optional[List[Dict[str, Any]]] = None,
    bootstrap_skills: Optional[List[Dict[str, Any]]] = None,  # NEW
    bootstrap_mcp_names: Optional[List[str]] = None,  # NEW
) -> Any:
    # If bootstrap_mcp_names provided, preload those MCPs
    # If bootstrap_skills provided, include in available_skills
    # ... rest of build_agent ...
```

---

## 7. Data Flow

```
Agent A                        Worker                       Agent B
   |                              |                            |
   | create_ticket(ticket)       |                            |
   |----------------------------->|                            |
   |                              |  thread-wakeup            |
   | assign_ticket(ticket, B)    |                            |
   |----------------------------->|                            |
   |                              |  ticket_assigned event   |
   |                              |----------------------------|
   |                              |  Fetch ticket            |
   |                              |  Parse JSON              |
   |                              |  Load bootstrap config   |
   |                              |  Build agent             |
   |                              |-------------------------->|
   |                              |                            | Execute work
   |                              |                            |
   | ticket_resolved event       |<---------------------------|
   |<-----------------------------|                            |
```

---

## 8. File Changes Summary

| File                | Change                                       |
| ------------------- | -------------------------------------------- |
| `mcp.plugin.ts`     | Add 7 ticket MCP tools                       |
| `agent_executor.py` | Add ticket-wakeup handler, parse description |
| `agent.py`          | Accept bootstrap_skills, bootstrap_mcp_names |
| `clients/config.py` | Add get_mcps_by_names, get_skills_by_names   |

---

## 9. Prioritization

| Phase | Items    | Description                    |
| ----- | -------- | ------------------------------ |
| 1     | 4.1-4.7  | Add all 7 ticket MCP tools     |
| 2     | 5.3, 6.1 | Worker ticket resume handling  |
| 3     | 6.2      | Agent bootstrap config loading |
