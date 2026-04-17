# SPEC: Tool Governance & Hooks System

## 1. Goal

Create a governance system enabling detection and interruption of agent tool activities using the existing ticket system for approval workflows.

---

## 2. Context

### 2.1 Existing Ticket System

- **Table**: `automation.tickets` (migrated to `core_automation.tickets`)
- **Columns**: id, thread_id, requester_job_id, status, priority, title, description, resolution_payload, assigned_to, created_at, updated_at, resolved_at
- **Status values**: open, in_progress, resolved, cancelled
- **API**: Full CRUD at `/api/tickets` in `uvian-automation-api`

### 2.2 Existing Tool Interceptor Pattern

- **Location**: `tool_node.py:200-281`
- **Type**: `ToolCallWrapper` / `AsyncToolCallWrapper`
- **Capabilities**: modify request, retry, short-circuit, conditional return
- **Current state**: Wired as `None` - not used

### 2.3 Reference Pattern (MCP Linking)

- **Tables**: `agents` → `agent_mcps` ← `mcps`
- **View**: `v_agent_mcps_with_secrets`
- **Functions**: `link_agent_mcp()`, `update_agent_mcp_link()`

---

## 3. Requirements

| #   | Requirement         | Description                                                      |
| --- | ------------------- | ---------------------------------------------------------------- |
| 3.1 | Extend agent_mcps   | Add `require_ticket_approval BOOLEAN DEFAULT false` per MCP link |
| 3.2 | Generic hooks table | Account-level hook definitions with trigger/action               |
| 3.3 | Agent hooks table   | Agent-level hook links (mirrors agent_mcps)                      |
| 3.4 | Reuse tickets       | Extend with tool-specific fields + pending status                |
| 3.5 | Agent integration   | Wire hooks into ToolNode execution                               |
| 3.6 | Human-in-the-loop   | Suspend until ticket resolved                                    |

---

## 4. Schema Design

### 4.1 agent_mcps Extension

```sql
ALTER TABLE core_automation.agent_mcps
ADD COLUMN IF NOT EXISTS require_ticket_approval BOOLEAN DEFAULT false;
```

### 4.2 hooks Table

```sql
CREATE TABLE core_automation.hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_json JSONB NOT NULL,  -- {"type": "tool_name_prefix", "pattern": "http_*"}
    action TEXT NOT NULL CHECK (action IN ('interrupt', 'log', 'block')),
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hooks_account_id ON core_automation.hooks(account_id);
CREATE INDEX idx_hooks_account_active ON core_automation.hooks(account_id, is_active);

-- RLS policies mirror mcps table pattern
CREATE POLICY "Account members can view hooks" ON core_automation.hooks FOR SELECT
USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Account admins can manage hooks" ON core_automation.hooks FOR ALL
WITH CHECK (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role->>'name' IN ('owner', 'admin')));

CREATE TRIGGER update_hooks_updated_at
    BEFORE UPDATE ON core_automation.hooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.3 agent_hooks Table

```sql
CREATE TABLE core_automation.agent_hooks (
    agent_id UUID NOT NULL REFERENCES core_automation.agents(id) ON DELETE CASCADE,
    hook_id UUID NOT NULL REFERENCES core_automation.hooks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, hook_id)
);

CREATE INDEX idx_agent_hooks_hook_id ON core_automation.agent_hooks(hook_id);
```

### 4.4 hooks View

```sql
CREATE OR REPLACE VIEW core_automation.v_agent_hooks_with_config AS
SELECT
    ah.agent_id,
    h.id AS hook_id,
    h.account_id,
    h.name,
    h.trigger_json,
    h.action,
    h.config,
    h.is_active
FROM core_automation.agent_hooks ah
INNER JOIN core_automation.hooks h ON ah.hook_id = h.id
WHERE h.is_active = true;

GRANT SELECT ON core_automation.v_agent_hooks_with_config TO authenticated, service_role;
```

### 4.5 Linking Functions

```sql
CREATE OR REPLACE FUNCTION core_automation.link_agent_hook(
    p_agent_id UUID,
    p_hook_id UUID
) RETURNS void AS $$
BEGIN
    INSERT INTO core_automation.agent_hooks (agent_id, hook_id)
    VALUES (p_agent_id, p_hook_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION core_automation.unlink_agent_hook(
    p_agent_id UUID,
    p_hook_id UUID
) RETURNS void AS $$
BEGIN
    DELETE FROM core_automation.agent_hooks
    WHERE agent_id = p_agent_id AND hook_id = p_hook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.6 Ticket Extensions

```sql
-- Add tool approval fields
ALTER TABLE automation.tickets
ADD COLUMN IF NOT EXISTS tool_name TEXT,
ADD COLUMN IF NOT EXISTS tool_call_id UUID,
ADD COLUMN IF NOT EXISTS approve_subsequent BOOLEAN DEFAULT false;

-- Add pending status
ALTER TABLE automation.tickets
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE automation.tickets
ADD CONSTRAINT tickets_status_check CHECK (
    status IN ('open', 'in_progress', 'pending', 'resolved', 'cancelled')
);

-- Pending approvals view
CREATE OR REPLACE VIEW automation.v_pending_tool_approvals AS
SELECT id, thread_id, tool_name, tool_call_id, title, created_at
FROM automation.tickets
WHERE status = 'pending' AND tool_name IS NOT NULL;

GRANT SELECT ON automation.v_pending_tool_approvals TO authenticated, service_role;
```

---

## 5. API Changes

### 5.1 Hooks Service Structure

| Component | Path                               |
| --------- | ---------------------------------- |
| Types     | `src/app/services/hooks/types.ts`  |
| Scoped    | `src/app/services/hooks/scoped.ts` |
| Admin     | `src/app/services/hooks/admin.ts`  |
| Routes    | `src/app/routes/hooks.ts`          |

### 5.2 Hooks Endpoints

| Method | Endpoint                         | Description        |
| ------ | -------------------------------- | ------------------ |
| POST   | `/api/hooks`                     | Create hook        |
| GET    | `/api/hooks`                     | List account hooks |
| GET    | `/api/hooks/:id`                 | Get hook           |
| PATCH  | `/api/hooks/:id`                 | Update hook        |
| DELETE | `/api/hooks/:id`                 | Delete hook        |
| POST   | `/api/hooks/:id/agents/:agentId` | Link to agent      |
| DELETE | `/api/hooks/:id/agents/:agentId` | Unlink from agent  |

### 5.3 Ticket Extensions

Extend `CreateTicketPayload`:

```typescript
interface CreateTicketPayload {
  threadId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  requesterJobId?: string;
  // New tool approval fields
  toolName?: string;
  toolCallId?: string;
  approveSubsequent?: boolean;
}
```

---

## 6. Worker Implementation

### 6.1 agent_executor.py Changes

```python
# Fetch hooks alongside MCPs
all_hooks = await get_agent_hooks(agent_user_id)

available_hooks = [
    {
        "id": h.get("id"),
        "name": h.get("name"),
        "trigger_json": h.get("trigger_json"),
        "action": h.get("action"),
    }
    for h in all_hooks if h.get("name")
]

# Pass to agent builder
agent = build_agent(
    llm_config,
    mcp_registry,
    checkpointer=checkpointer,
    hooks=available_hooks
)
```

### 6.2 agent.py Changes

```python
def build_agent(
    llm_config: Optional[Dict[str, Any]] = None,
    mcp_registry: Optional[MCPRegistry] = None,
    checkpointer=None,
    hooks: Optional[List[Dict[str, Any]] = None,  # NEW
) -> Any:
    # ...
    tool_node = ToolNode(
        default_tools,
        handle_tool_errors=True,
        mcp_registry=mcp_registry,
        awrap_tool_call=create_tool_approval_wrapper(hooks) if hooks else None,
    )
```

### 6.3 tool_node.py Implementation

```python
async def create_tool_approval_wrapper(
    hooks: Optional[List[Dict[str, Any]]] = None,
    tool_approval_cache: Optional[Dict] = None,  # NEW: cache for approved tools
) -> AsyncToolCallWrapper:
    """Intercepts tool calls matching hook triggers."""

    async def handler(request, execute):
        tool_name = request.tool_call.get("name")
        thread_id = request.state.get("thread_id")

        # Check cache first for approved_subsequent
        if tool_approval_cache:
            cache_key = f"{thread_id}:{tool_name}"
            if tool_approval_cache.get(cache_key):
                return await execute(request)

        matched_hook = _find_matching_hook(hooks, tool_name)

        if not matched_hook:
            return await execute(request)

        if matched_hook.get("action") == "interrupt":
            return await _handle_interrupt(request, matched_hook)

        return await execute(request)

    return handler


def _find_matching_hook(hooks, tool_name):
    """Match tool against hook trigger_json patterns."""
    for hook in hooks:
        trigger = hook.get("trigger_json", {})
        trigger_type = trigger.get("type")
        pattern = trigger.get("pattern")

        if trigger_type == "tool_name_prefix" and pattern:
            prefix = pattern.replace("*", "")
            if tool_name.startswith(prefix):
                return hook
    return None


async def _handle_interrupt(request, hook):
    """Create ticket - routing node will force END immediately."""

    # 1. Create ticket (status=pending)
    ticket_id = await _create_approval_ticket(
        thread_id=request.state.get("thread_id"),
        tool_name=request.tool_call.get("name"),
        tool_call_id=request.tool_call.get("id"),
    )

    # 2. Return pending - routing node will force END
    # Agent cannot continue - no path around END
    return ToolMessage(
        content=f"Tool approval pending. Ticket: {ticket_id}",
        tool_call_id=request.tool_call.get("id"),
        status="pending_approval",
        extra={
            "ticket_id": ticket_id,
            "tool_name": request.tool_call.get("name"),
        }
    )
```

### 6.4 Add Approval Routing Node

After creating a ticket, force the agent to END immediately - no path to continue:

```python
def create_approval_routing_node():
    """Force END if pending approval exists - agent cannot continue."""

    def approval_routing_node(state: MessagesState) -> Command:
        pending_approval = state.get("pending_tool_approval")
        if pending_approval:
            # Agent MUST end - no choice, no alternative path
            return Command(goto=END)

        return {"continue": True}

    return approval_routing_node
```

### 6.5 Update agent.py Build Graph

Add routing node to force END after tool execution:

```python
# In build_agent, after creating ToolNode
approval_routing = create_approval_routing_node()

agent_builder.add_node("approval_routing_node", approval_routing)

# Edge: tool_node -> approval_routing -> END
agent_builder.add_edge("tool_node", "approval_routing_node")
agent_builder.add_edge("approval_routing_node", END)
```

This ensures the graph has no path around the END - the agent cannot skip the approval.

### 6.6 Agent Resume on Ticket Resolution

When the agent resumes after ticket resolution:

```python
async def _handle_resume_on_approval(request):
    """Handle agent resuming after ticket resolution."""
    # Called from sync_node or model_node after receiving resolution event
    pending_approval = request.state.get("pending_tool_approval")

    if not pending_approval:
        return None

    ticket_id = pending_approval.get("ticket_id")
    tool_name = pending_approval.get("tool_name")

    # Fetch ticket resolution
    ticket = await _get_ticket_status(ticket_id)

    if ticket.status in ("denied", "cancelled"):
        return ToolMessage(
            content=f"Tool call denied: {ticket.resolution_payload.get('reason', 'Not approved')}",
            tool_call_id=pending_approval.get("tool_call_id"),
            status="error"
        )

    # If approved and approve_subsequent, add to cache
    if ticket.status == "resolved" and ticket.approve_subsequent:
        cache_key = f"{request.state.get('thread_id')}:{tool_name}"
        await _add_to_approval_cache(cache_key)

    return None  # Continue normal execution - tool will be re-called
```

---

## 7. Data Flow

### 7.1 Initial Flow (Tool Interrupted)

```
┌─────────────────────────────────────────────────────┐
│ Agent Executor                                    │
│  - Fetch config (secrets, MCPs, skills, hooks)   │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ Build Agent Graph                                 │
│  - Pass hooks to ToolNode via awrap_tool_call    │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ Tool Call Made                                    │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ ToolCallWrapper (intercept)                        │
│  - Match tool_name vs hook.trigger_json           │
│  - Check approval cache                         │
└─────────────────┬───────────────────────────────┘
                  ↓
          ┌────────┴────────┐
          ↓                 ↓
    Cache hit           No cache match
    ↓                   ↓
    execute()      ┌─────────────────────┐
                   │ Match hook +        │
                   │ action=interrupt    │
                   └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Create ticket     │
                 │ status=pending    │
                 └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Return "pending"   │
                 │ status=           │
                 │ pending_approval   │
                 └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Approval routing  │
                 │ node checks      │
                 │ pending_approval │
                 └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Command(goto=END) │
                 │ - Forces END      │
                 │ - No continuation │
                 └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Checkpoint saves   │
                 │ state             │
                 └────────┬────────┘
                          ↓
                 ┌───────────────────┐
                 │ Execution ends    │
                 └───────────────────┘
```

### 7.2 Resume Flow (Event-Based)

```
┌─────────────────────────────────────────────────────┐
│ Ticket Resolved (external)                        │
│  - User resolves ticket via API                 │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ POST /api/tickets/:id/resolve                   │
│  - Update status to resolved/denied             │
│  - Store resolution_payload                     │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────��───────────────────────────────────────────────┐
│ Emit ticket_resolved event                       │
│  - com.uvian.ticket.ticket_resolved             │
│  - Includes: ticket_id, thread_id, approval_   │
│    status, reason                               │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ thread_inbox receives event                      │
│  - Stores pending message for thread             │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Job created: thread-wakeup                       │
│  - Wakes up agent for thread_id                 │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Worker picks up job                             │
│  - sync_node fetches pending messages           │
│  - TicketResolvedTransformer converts event   │
└─────────────────┬───────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ Agent resumes                                    │
│  - Check pending_tool_approval in state        │
│  - If denied: return error ToolMessage         │
│  - If approved: execute tool (or cache)        │
└─────────────────────────────────────────────────────┘
```

---

## 8. Edge Cases

| Case                    | Handling                                  |
| ----------------------- | ----------------------------------------- |
| Multiple matching hooks | First match wins (by creation order)      |
| Agent restart mid-wait  | Checkpoint saves state, resumes correctly |
| Cached approvals        | Use thread_id + tool_name key             |
| Ticket resolution event | Uses existing event infrastructure        |

---

## 9. File Changes Summary

| File                                                               | Change                              |
| ------------------------------------------------------------------ | ----------------------------------- |
| `migrations/0077_add_require_ticket_approval.sql`                  | agent_mcps column                   |
| `migrations/0078_create_hooks_tables.sql`                          | hooks + agent_hooks tables          |
| `migrations/0079_extend_tickets_for_tool_approval.sql`             | ticket fields + pending status      |
| `uvian-automation-api/src/app/routes/hooks.ts`                     | Hooks CRUD endpoints                |
| `uvian-automation-api/src/app/services/hooks/*`                    | Hooks service                       |
| `uvian-automation-api/src/app/services/ticket/types.ts`            | Extend types + tool approval fields |
| `uvian-automation-api/src/app/routes/tickets.ts`                   | Emit ticket_resolved event          |
| `uvian-automation-worker/.../executors/agent_executor.py`          | Fetch hooks                         |
| `uvian-automation-worker/.../core/agents/universal_agent/agent.py` | Pass hooks                          |
| `uvian-automation-worker/.../core/agents/utils/nodes/tool_node.py` | Tool approval wrapper               |
| `uvian-automation-worker/.../core/agents/event_transformers/*`     | TicketResolvedTransformer           |

### Additional Components to Add

| Component                 | Description                                     |
| ------------------------- | ----------------------------------------------- |
| TicketResolvedTransformer | Converts ticket_resolved event to agent message |

---

## 10. Prioritization

| Phase | Items                   | Description                                          |
| ----- | ----------------------- | ---------------------------------------------------- |
| 1     | 4.1, 4.2, 4.3, 4.5      | DB schema (hooks tables, linking, ticket extensions) |
| 2     | 5.1, 5.2, 5.3           | API (hooks service + endpoints, ticket types)        |
| 3     | 6.1, 6.2, 6.3, 6.4, 6.5 | Worker (fetch hooks, wire into ToolNode, routing)    |
| 4     | 6.6                     | Event emit + transformer                             |

Note: Phase 4 depends on event emitter being added to ticket resolve endpoint.
