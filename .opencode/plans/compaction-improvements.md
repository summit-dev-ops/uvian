# Plan: Compaction Logic Improvements

## 1. Goal

Improve the compaction logic in the uvian-automation-worker to prevent infinite loops, handle edge cases, and track token usage more accurately.

---

## 2. Context

### 2.1 Current Compaction Flow

```
sync_node → check_context() → model_node
                    ↓ (if context_size > 123,500)
                    compaction_node → sync_node → model_node
```

### 2.2 Current Files

| File                                                                          | Purpose                                  |
| ----------------------------------------------------------------------------- | ---------------------------------------- |
| `apps/uvian-automation-worker/.../core/agents/utils/tokens.py`                | Token counting + check_context routing   |
| `apps/uvian-automation-worker/.../core/agents/utils/nodes/compaction_node.py` | Summarizes old messages                  |
| `apps/uvian-automation-worker/.../core/agents/utils/nodes/model_node.py`      | Uses compaction_state to prepend summary |

### 2.3 Current Issues

| Issue                          | Location                          | Impact                                                                                                                                  |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **No re-compaction guard**     | `tokens.py`, `compaction_node.py` | After compaction, flow goes through check_context again. If summary + recent messages still exceed threshold → infinite compaction loop |
| **Rough token estimation**     | `tokens.py:5-6`                   | `char ÷ 4` is inaccurate for code/non-English content                                                                                   |
| **session_context_size reset** | `compaction_node.py:99`           | Sets to `0` after compaction, losing accurate token tracking                                                                            |
| **No "just compacted" skip**   | `tokens.py`                       | No guard to skip if compaction just happened in current execution                                                                       |

### 2.4 Recent Failure Context

From logs (job: `43e67402-4188-4dea-853c-2089c7294a00`):

- After compaction at call 7, tool error (Discord message >2000 chars)
- `compaction_node` ran, created `compaction_state` with `message_offset: 21`
- On retry: context still exceeded threshold but state restoration failed
- Error: `'Attempted to exit cancel scope in a different task than it was entered in'`

---

## 3. Requirements

| #   | Requirement                                                                       | Description |
| --- | --------------------------------------------------------------------------------- | ----------- |
| 3.1 | Prevent re-compaction loop - Add guard to skip if compaction just happened        |
| 3.2 | Track compaction in state - Add flag to prevent immediate re-trigger              |
| 3.3 | Better token tracking - Use LLM-provided token counts instead of rough estimation |
| 3.4 | Dynamic recent messages - Keep more or fewer based on actual context size         |

---

## 4. The Actual Problem

### Root Cause: Fallback doesn't respect compaction_offset

In `tokens.py:15-18`:

```python
if context_size is None or context_size == 0:
    context_size = count_tokens(state["messages"], system_prompt)
```

This counts **ALL messages**, not just the visible ones after compaction.

Compare to `model_node.py:128-132` which correctly respects offset:

```python
message_offset = compaction_state.get("message_offset", 0)
if summary and message_offset > 0:
    visible_messages = state["messages"][message_offset:]  # ✓ Correct!
```

So after compaction:

- `session_context_size = 0`
- Fallback counts ALL messages (including compacted ones)
- Overestimates by huge margin
- Can trigger unnecessary re-compaction

---

## 4. Proposed Fixes

### 4.1 Fix Fallback in tokens.py

Update the fallback to respect compaction_offset:

```python
def check_context(state: MessagesState) -> str:
    MAX_TOKENS = 124000
    SAFETY_BUFFER = 500
    TRIGGER_THRESHOLD = MAX_TOKENS - SAFETY_BUFFER

    context_size = state.get("session_context_size", 0)

    if context_size is None or context_size == 0:
        compaction_state = state.get("compaction_state", {})
        message_offset = compaction_state.get("message_offset", 0)

        if message_offset > 0:
            # Only count visible messages after compaction
            visible_msgs = state["messages"][message_offset:]
            context_size = count_tokens(visible_msgs, system_prompt)
        else:
            context_size = count_tokens(state["messages"], system_prompt)

    if context_size > TRIGGER_THRESHOLD:
        return "compaction_node"
    return "model_node"
```

Note: Get system_prompt before the offset check:

```python
if context_size is None or context_size == 0:
    system_msgs = [m for m in state["messages"] if isinstance(m, SystemMessage)]
    system_prompt = system_msgs[0].content if system_msgs else ""

    compaction_state = state.get("compaction_state", {})
    message_offset = compaction_state.get("message_offset", 0)

    if message_offset > 0:
        visible_msgs = state["messages"][message_offset:]
        context_size = count_tokens(visible_msgs, system_prompt)
    else:
        context_size = count_tokens(state["messages"], system_prompt)
```

---

## 5. File Changes Summary

| File        | Change                                 |
| ----------- | -------------------------------------- |
| `tokens.py` | Fix fallback to respect message_offset |

One change in one file.

---

## 6. Implementation

Update fallback in `tokens.py` to check `compaction_state.message_offset` and count only visible messages.

---

## 7. Edge Cases

| Case                          | Handling                                    |
| ----------------------------- | ------------------------------------------- |
| No compaction yet (first run) | message_offset = 0, counts all messages     |
| After compaction              | Counts only visible messages                |
| State restored on retry       | message_offset persists in compaction_state |
