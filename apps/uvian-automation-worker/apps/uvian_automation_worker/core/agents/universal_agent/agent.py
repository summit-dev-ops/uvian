from typing import List, Any, Optional, Dict, Literal
from langgraph.types import Command, RetryPolicy
from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.models import create_llm
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.nodes.sync_node import create_sync_node
from core.agents.utils.nodes.cleanup_node import create_cleanup_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.compaction_node import create_compaction_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.tool_node import ToolNode, tools_condition
from core.agents.utils.tool_approval import create_tool_approval_wrapper
from core.agents.utils.nodes.expected_tool_check_node import create_expected_tool_check_node
from clients.mcp import MCPRegistry
from clients.config import create_tool_approval_ticket


async def build_agent(
    llm_config,
    mcp_registry=None,
    checkpointer=None,
    hooks=None,
):
    default_tools = base_tools.copy()
    llm_cfg = llm_config or {}
    llm = create_llm(llm_cfg)

    if checkpointer is None:
        checkpointer = PostgresAsyncCheckpointer()
    agent_builder = StateGraph(MessagesState)

    llm_retry_policy = RetryPolicy(
        initial_interval=2.0,
        backoff_factor=2.0,
        max_attempts=5,
        max_interval=32.0,
        jitter=True,
    )

    tool_retry_policy = RetryPolicy(
        initial_interval=1.0,
        backoff_factor=2.0,
        max_attempts=3,
        max_interval=16.0,
        jitter=True,
    )

    sync_retry_policy = RetryPolicy(
        initial_interval=1.0,
        backoff_factor=2.0,
        max_attempts=3,
        max_interval=16.0,
        jitter=True,
    )

    compaction_retry_policy = RetryPolicy(
        initial_interval=1.0,
        backoff_factor=2.0,
        max_attempts=2,
        max_interval=4.0,
        jitter=True,
    )

    model_node = create_model_node(llm, default_tools, mcp_registry=mcp_registry)
    compaction_node = create_compaction_node(llm)

    tool_approval_wrapper = None
    if hooks:
        tool_approval_wrapper = await create_tool_approval_wrapper(hooks, create_tool_approval_ticket)

    tool_node = ToolNode(
        default_tools,
        handle_tool_errors=True,
        mcp_registry=mcp_registry,
        awrap_tool_call=tool_approval_wrapper,
    )
    sync = create_sync_node(mcp_registry)
    cleanup = create_cleanup_node(mcp_registry)
    expected_tool_check = create_expected_tool_check_node()


    def tools_condition_with_expectations(state) -> Literal["tools", "no_tools"]:
        """Route based on tool calls in model response."""
        messages = state.get("messages", [])
        last_message = messages[-1] if messages else None
        if last_message and hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "no_tools"

    agent_builder.add_node("sync_node", sync, retry=sync_retry_policy)
    agent_builder.add_node("model_node", model_node, retry=llm_retry_policy)
    agent_builder.add_node("tool_node", tool_node, retry=tool_retry_policy)
    agent_builder.add_node("compaction_node", compaction_node, retry=compaction_retry_policy)
    agent_builder.add_node("cleanup_node", cleanup)
    agent_builder.add_node("expected_tool_check_node", expected_tool_check)

    agent_builder.add_edge(START, "sync_node")
    agent_builder.add_conditional_edges(
        "sync_node",
        check_context,
        {
            "compaction_node": "compaction_node",
            "model_node": "model_node",
        },
    )

    agent_builder.add_edge("compaction_node", "sync_node")

    agent_builder.add_conditional_edges(
        "model_node",
        tools_condition_with_expectations,
        {"tools": "tool_node", "no_tools": "expected_tool_check_node"},
    )

    agent_builder.add_edge("tool_node", "sync_node")

    agent_builder.add_edge("expected_tool_check_node", "cleanup_node")

    agent_builder.add_edge("cleanup_node", END)

    return agent_builder.compile(checkpointer=checkpointer)
