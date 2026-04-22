"""Expected tool call check node.

This node runs when the model generates NO tool calls.
It checks if there are pending expected tool calls and:
- If pending: inserts reminder message and routes back to model_node
- If complete: routes to cleanup_node (normal completion)
"""
from typing import Dict, Any, List, Literal
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
        
        pending_patterns = {exp["pattern"] for exp in expected if exp.get("pattern")}
        
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