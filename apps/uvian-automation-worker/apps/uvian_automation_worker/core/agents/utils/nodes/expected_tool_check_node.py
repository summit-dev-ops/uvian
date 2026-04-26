"""Expected tool call check node.

This node runs when the model generates NO tool calls.
It checks if there are remaining expected tool calls from current job:
- If none: routes to cleanup_node (normal completion)
- If pending: inserts reminder message and routes back to model_node

Note: ToolNode is responsible for removing satisfied expectations from state.
"""
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command
from core.logging import log


def create_expected_tool_check_node():
    async def check_node(state: Dict[str, Any], config: RunnableConfig) -> Command:
        expected = state.get("expected_tool_calls", [])
        
        if not expected:
            log.debug("expected_tool_check_no_expectations", node="expected_tool_check_node")
            return {}
        
        pending_list = sorted({e.get("pattern") for e in expected if e.get("pattern")})
        log.debug(
            "expected_tool_check_pending",
            node="expected_tool_check_node",
            pending=pending_list,
        )
        
        reminder = HumanMessage(
            content=f"The following actions are expected but not yet performed: {', '.join(pending_list)}"
        )
        return Command(update={"messages": [reminder]}, goto="sync_node")
    
    return check_node