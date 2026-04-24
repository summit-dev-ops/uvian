# SPEC: Expected Tool Calls Hook Effects

## Problem

Two issues with current `expected_tool_call` hook effect implementation:
1. `expected_tool_check_node` compares against entire message history, should only check current job's messages
2. `expected_tool_calls` are never cleared when agent ends

## Solution

Manipulate `expected_tool_calls` state from ToolNode to remove satisfied expectations. The `expected_tool_check_node` then simply checks if expectations are empty.

## Implementation

### 1. ToolNode - Remove satisfied expectations

**File:** `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/nodes/tool_node.py`

**Changes:**
- Access `expected_tool_calls` from state via `ToolRuntime`
- After each tool executes, extract executed tool name from `ToolCallRequest.tool_call["name"]`
- Match against patterns in `expected_tool_calls`
- Build remaining expectations list (unsatisfied ones)
- Return `Command(update={"expected_tool_calls": remaining}, goto=...)` to drop satisfied expectations

**Pattern matching:**
```python
def _match_tool_pattern(tool_name: str, pattern: str) -> bool:
    if pattern.endswith("*"):
        return tool_name.startswith(pattern[:-1])
    return tool_name == pattern
```

### 2. expected_tool_check_node - Simple empty check

**File:** `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/nodes/expected_tool_check_node.py`

**Changes:**
- Simplify to just check if `expected_tool_calls` is empty
- If empty → `goto="cleanup_node"`
- If not empty → `goto="model_node"` with reminder message (existing logic)

```python
def check_node(state: Dict[str, Any], config: RunnableConfig) -> Command:
    expected = state.get("expected_tool_calls", [])
    
    if not expected:
        return Command(goto="cleanup_node")
    
    pending_list = sorted({e.get("pattern") for e in expected if e.get("pattern")})
    reminder = HumanMessage(
        content=f"The following actions are expected but not yet performed: {', '.join(pending_list)}"
    )
    return Command(update={"messages": [reminder]}, goto="model_node")
```

### 3. State field (already exists)

**File:** `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/state.py`

The `expected_tool_calls` field already exists:
```python
expected_tool_calls: Annotated[List[Dict[str, Any]], operator.add]
```

No changes needed.

### 4. sync_node sets expectations (already exists)

**File:** `apps/uvian-automation-worker/apps/uvian_automation_worker/core/agents/utils/nodes/sync_node.py`

The `sync_node` already extracts and sets `expected_tool_calls` from hook effects at line 128, 279, 288. No changes needed.

## Flow

1. **sync_node** → Extracts `expect_tool_call` effects from hooks, sets in state
2. **model_node** → Generates tool calls
3. **tool_node** → Executes tools, removes satisfied expectations from state
4. **expected_tool_check_node** → Checks if remaining expectations; routes accordingly
5. **cleanup_node** → Agent ends (no explicit clearing needed since state resets per job)

## Edge Cases

- **No tool calls generated**: `expected_tool_check_node` handles with reminder
- **Tool call satisfies multiple expectations**: Remove all matching patterns
- **Partial match with prefix patterns**: `mcp_*` matches any tool starting with "mcp_"
- **Backward compatibility**: If `expected_tool_calls` not in state, treat as empty