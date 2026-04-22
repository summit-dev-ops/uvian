# Expected Tool Calls Hook System Specification

## Overview

This system extends the existing hook framework to define expected tool call patterns for events. Used for acceptance criteria - the agent must perform expected tool calls before completing.

## Core Concepts

- **Expected Tool Call**: A tool name pattern that the agent should call given an event
- **Hook Effect**: `expect_tool_call` effect type indicates an expected tool pattern
- **Deduplication**: Same hook from same event type = single expectation (does not accumulate)
- **Accumulation**: Different hook events accumulate in state across iterations

## Data Flow

```
Event → sync_node → get_hooks_for_event() → expected_tool_calls in state
                                                         ↓
model_node (generates tool calls / text) → tools_condition
                                                         ↓
                                          ┌──────────────┴──────────────┐
                                     [has tool calls]          [no tool calls]
                                                ↓                    ↓
                                    tool_node → check       check_node
                                                └──────────────┬──────────────┘
                                                             ↓
                                              ┌──────────────┴──────────────┐
                                         [unmet] ─────→ model_node      [met] ──→ END
```

## API Changes (automation-api)

### Database Schema

Add new effect type to `v_agent_hooks_for_worker` view:

```sql
-- Effect types enum should include:
'load_mcp', 'load_skill', 'expect_tool_call'

-- Example hook configuration:
{
  "id": "hook-123",
  "name": "ticket_reply_expected",
  "trigger_json": {
    "type": "event",
    "patterns": ["com.uvian.ticket.created"]
  },
  "action": "interrupt",  -- or "block"
  "effects": [
    {
      "effect_type": "expect_tool_call",
      "effect_id": "create_ticket_reply_*"  -- prefix pattern
    }
  ]
}
```

### API Endpoint Updates

#### GET /api/agents/{agent_user_id}/hooks

Response includes new effect type:

```json
{
  "hooks": [
    {
      "hook_id": "hook-123",
      "name": "ticket_reply_expected",
      "trigger_json": {"type": "event", "patterns": ["com.uvian.ticket.created"]},
      "action": "interrupt",
      "effects": [
        {
          "effect_type": "expect_tool_call",
          "effect_id": "create_ticket_reply_*"
        }
      ]
    }
  ]
}
```

## Code Changes

### 1. State Schema (`core/agents/utils/state.py`)

```python
class MessagesState(TypedDict):
    # ... existing fields ...
    expected_tool_calls: Annotated[List[Dict[str, Any]], operator.add]
```

`expected_tool_calls` entry format:
```python
{
    "pattern": "create_reply_*",           # tool name prefix pattern
    "source_hook": "ticket_reply",         # hook name for debugging
    "event_type": "com.uvian.ticket.created"  # which event triggered this
}
```

### 2. Hook Loader (`core/agents/utils/loader.py`)

Extend `get_hooks_for_event()` to extract expected tool calls:

```python
def get_hooks_for_event(
    event_type: str,
    hooks: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """Filter hooks matching event type and extract MCPs, skills, and expected tool calls.
    
    Returns:
        Dict with 'load_mcp', 'load_skill', 'expected_tool_calls' lists
    """
    if not event_type or not hooks:
        return {"load_mcp": [], "load_skill": [], "expected_tool_calls": []}
    
    matched_hooks = [
        h for h in hooks
        if h.get("trigger_json", {}).get("type") == "event"
        and _match_event_pattern(event_type, h.get("trigger_json", {}).get("patterns", []))
    ]
    
    # Extract expected tool calls (deduplicated by pattern)
    expected_tool_calls = []
    seen_patterns = set()
    
    for hook in matched_hooks:
        for effect in hook.get("effects", []):
            if effect.get("effect_type") == "expect_tool_call":
                pattern = effect.get("effect_id")
                if pattern and pattern not in seen_patterns:
                    seen_patterns.add(pattern)
                    expected_tool_calls.append({
                        "pattern": pattern,
                        "source_hook": hook.get("name"),
                        "event_type": event_type
                    })
    
    return {
        "load_mcp": mcps_to_load,
        "load_skill": skills_to_load,
        "expected_tool_calls": expected_tool_calls
    }
```

### 3. Sync Node (`core/agents/utils/nodes/sync_node.py`)

Pass expected tool calls to state:

```python
# In sync_node processing:
hooks_result = get_hooks_for_event(event_type, all_hooks)
new_expected_calls = hooks_result.get("expected_tool_calls", [])

# ... state updates ...
result = {
    "messages": new_messages,
    "expected_tool_calls": new_expected_calls,  # accumulate via operator.add
    ...
}
```

### 4. Expected Tool Check Node (NEW FILE)

`core/agents/utils/nodes/expected_tool_check_node.py`

```python
"""Expected tool call check node.

This node runs when the model generates NO tool calls.
It checks if there are pending expected tool calls and:
- If pending: inserts reminder message and routes back to model_node
- If complete: routes to cleanup_node (normal completion)
"""
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command
from core.logging import log


def _match_tool_pattern(tool_name: str, pattern: str) -> bool:
    """Match tool name against pattern (prefix only)."""
    if pattern.endswith("*"):
        return tool_name.startswith(pattern[:-1])
    return tool_name == pattern


def create_expected_tool_check_node():
    async def check_node(state: Dict[str, Any], config: RunnableConfig) -> Command:
        expected = state.get("expected_tool_calls", [])
        
        if not expected:
            log.debug("expected_tool_check_no_expectations", node="expected_tool_check_node")
            return Command(goto="cleanup_node")
        
        # Extract pending patterns (deduplicated)
        pending_patterns = {exp["pattern"] for exp in expected if exp.get("pattern")}
        
        # Detect completed tools by analyzing ToolMessages in state
        messages = state.get("messages", [])
        completed: List[str] = []
        for msg in messages:
            if isinstance(msg, ToolMessage):
                tool_name = getattr(msg, "name", None)
                if not tool_name:
                    tool_call = getattr(msg, "tool_call", None)
                    if tool_call:
                        tool_name = tool_call.get("name")
                if tool_name:
                    completed.append(tool_name)
        
        # Check pending patterns against completed tools
        still_pending = set()
        for pattern in pending_patterns:
            matched = any(
                _match_tool_pattern(tool_name, pattern)
                for tool_name in completed
            )
            if not matched:
                still_pending.add(pattern)
        
        log.debug(
            "expected_tool_check_result",
            node="expected_tool_check_node",
            expected=list(pending_patterns),
            completed=completed,
            still_pending=list(still_pending),
        )
        
        if still_pending:
            pending_list = sorted(still_pending)
            reminder = HumanMessage(
                content=f"The following actions are expected but not yet performed: {', '.join(pending_list)}"
            )
            return Command(update={"messages": [reminder]}, goto="model_node")
        
        return Command(goto="cleanup_node")
    
    return check_node
```

### 5. Agent Graph (`core/agents/universal_agent/agent.py`)

Add expected tool check node and update routing:

```python
from core.agents.utils.nodes.expected_tool_check_node import create_expected_tool_check_node
from typing import Literal

def tools_condition_with_expectations(state) -> Literal["tools", "no_tools"]:
    """Route based on tool calls in model response."""
    messages = state.get("messages", [])
    last_message = messages[-1] if messages else None
    if last_message and hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "no_tools"

# In build_agent():
check_node = create_expected_tool_check_node()
agent_builder.add_node("expected_tool_check_node", check_node)

# Replace simple tools_condition routing
agent_builder.add_conditional_edges(
    "model_node",
    tools_condition_with_expectations,
    {"tools": "tool_node", "no_tools": "expected_tool_check_node"},
)

agent_builder.add_edge("expected_tool_check_node", "cleanup_node")
```

## Routing Summary

| Model Output | Route |
|--------------|-------|
| Has tool_calls | → tool_node |
| No tool_calls | → expected_tool_check_node |

| Check Result | Route |
|--------------|-------|
| Pending expectations | → model_node (with reminder) |
| All expectations met | → cleanup_node → END |

## Behavior Examples

### Example 1: Ticket Created Event

```
Event: com.uvian.ticket.created
Hook: {trigger: event, pattern: "com.uvian.ticket.created", effect: expect_tool_call("create_ticket_reply_*")}

Flow:
1. sync_node processes event, adds expected_tool_calls = [{"pattern": "create_ticket_reply_*", ...}]
2. model_node generates: [ToolCall(create_ticket_reply message="...")]
3. tools_condition → tools
4. tool_node executes, creates ToolMessage
5. expected_tool_check_node → all met → cleanup_node → END
```

### Example 2: Agent Returns Text Without Tool Calls

```
Event: com.uvian.ticket.created
Hook: {trigger: event, pattern: "com.uvian.ticket.created", effect: expect_tool_call("create_ticket_reply_*")}

Flow:
1. sync_node processes event, adds expected_tool_calls
2. model_node generates: "I'll help you with that."
3. tools_condition → no_tools
4. expected_tool_check_node → pending! → reminder → model_node
5. model_node (with reminder) generates: [ToolCall(create_ticket_reply message="...")]
6. tool_node executes
7. expected_tool_check_node → met → cleanup_node → END
```

### Example 3: Multiple Same Events (Deduplication)

```
Events: 5x com.uvian.ticket.created (same ticket type)

Flow:
1. sync_node fetches 5 pending messages
2. get_hooks_for_event dedupes by pattern → 1 expected_tool_calls entry
3. Single expectation tracked
4. Works as normal flow
```

### Example 4: Different Event Types (Accumulation)

```
Events: com.uvian.ticket.created, com.uvian.ticket.updated
Hooks: 
- ticket.created → expect_tool_call("create_ticket_reply_*")
- ticket.updated → expect_tool_call("update_ticket_*")

Flow:
1. sync_node processes both events
2. expected_tool_calls = [create_ticket_reply_*, update_ticket_*]
3. Both must be completed
```

## Edge Cases

| Edge Case | Handling |
|----------|----------|
| No hooks configured | expected_tool_calls empty → routes to cleanup_node |
| Tool call matches multiple patterns | All matching patterns removed from pending |
| Model generates text then tools | routes through check first time, then tools |
| Recursion limit reached | Handled by existing LangGraph recursion_limit |
| Tool call fails/error | Should still count as attempted, can track separately if needed |

## Monitoring

Add logging for observability:

```
expected_tool_check_result - traces pending vs completed
expected_tool_check_no_expectations - when no expectations exist
```

## Testing (Future)

- Unit test loader deduplication
- Unit test pattern matching
- Integration test full flow
- Test multiple event accumulation
- Test same event deduplication