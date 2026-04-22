from typing import List, Any, Optional, Dict
from langgraph.types import Command
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

    def approval_routing_node(state):
        pending_tool_approval = state.get("pending_tool_approval")
        if pending_tool_approval:
            return Command(goto=END)
        return Command(goto="sync_node")

    agent_builder.add_node("sync_node", sync)
    agent_builder.add_node("model_node", model_node)
    agent_builder.add_node("tool_node", tool_node)
    agent_builder.add_node("compaction_node", compaction_node)
    agent_builder.add_node("cleanup_node", cleanup)
    agent_builder.add_node("approval_routing_node", approval_routing_node)

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
        tools_condition,
        {"tools": "tool_node", "__end__": "cleanup_node"},
    )

    agent_builder.add_edge("cleanup_node", END)

    agent_builder.add_edge("tool_node", "approval_routing_node")
    agent_builder.add_edge("approval_routing_node", END)

    return agent_builder.compile(checkpointer=checkpointer)
