from typing import List, Any, Optional, Dict
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
from clients.mcp import MCPRegistry


def build_agent(
    llm_config: Optional[Dict[str, Any]] = None,
    mcp_registry: Optional[MCPRegistry] = None,
    checkpointer=None,
) -> Any:
    default_tools = base_tools.copy()

    llm_cfg = llm_config or {}
    llm = create_llm(llm_cfg)

    if checkpointer is None:
        checkpointer = PostgresAsyncCheckpointer()
    agent_builder = StateGraph(MessagesState)

    model_node = create_model_node(llm, default_tools, mcp_registry=mcp_registry)
    compaction_node = create_compaction_node(llm)
    tool_node = ToolNode(default_tools, handle_tool_errors=True, mcp_registry=mcp_registry)
    sync = create_sync_node(mcp_registry)
    cleanup = create_cleanup_node(mcp_registry)

    agent_builder.add_node("sync_node", sync)
    agent_builder.add_node("model_node", model_node)
    agent_builder.add_node("tool_node", tool_node)
    agent_builder.add_node("compaction_node", compaction_node)
    agent_builder.add_node("cleanup_node", cleanup)

    # Graph starts after checkpoint restoration - sync_node handles initialization
    agent_builder.add_edge(START, "sync_node")
    # Check context after throttling - handles routing (compaction vs model)
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

    agent_builder.add_edge("tool_node", "sync_node")

    return agent_builder.compile(checkpointer=checkpointer)
