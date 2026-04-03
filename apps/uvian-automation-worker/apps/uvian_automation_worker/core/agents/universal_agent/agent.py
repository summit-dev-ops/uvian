from typing import List, Any, Optional, Dict
from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.models import create_openai_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.summarizer_node import create_summarize_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.throttle_node import throttle_node
from core.agents.utils.nodes.tool_node import ToolNode
from langgraph.prebuilt import tools_condition
from langchain_core.tools import BaseTool
from clients.mcp import MCPRegistry


def build_agent(
    mcp_tools: Optional[List[BaseTool]] = None,
    llm_config: Optional[Dict[str, Any]] = None,
    mcp_registry: Optional[MCPRegistry] = None,
) -> Any:
    tools = base_tools.copy()
    if mcp_tools:
        tools.extend(mcp_tools)

    llm_cfg = llm_config or {}
    llm = create_openai_model(llm_cfg)

    checkpointer = PostgresAsyncCheckpointer()
    agent_builder = StateGraph(MessagesState)

    model_node = create_model_node(llm, tools, mcp_registry=mcp_registry)
    summarize_node = create_summarize_node(llm, agent_name="DataBot")
    tool_node = ToolNode(tools, handle_tool_errors=True, mcp_registry=mcp_registry)

    def check_context_node(state: MessagesState) -> MessagesState:
        return state

    agent_builder.add_node("check_context_node", check_context_node)
    agent_builder.add_node("model_node", model_node)
    agent_builder.add_node("tool_node", tool_node)
    agent_builder.add_node("summarize_node", summarize_node)
    agent_builder.add_node("throttle_node", throttle_node)

    agent_builder.add_edge(START, "check_context_node")
    agent_builder.add_edge("summarize_node", "model_node")

    agent_builder.add_conditional_edges(
        "check_context_node",
        check_context,
        {
            "summarize_node": "summarize_node",
            "model_node": "model_node"
        }
    )

    agent_builder.add_conditional_edges(
        "model_node",
        tools_condition,
        {"tools": "tool_node", "__end__": END},
    )

    agent_builder.add_edge("tool_node", "throttle_node")
    agent_builder.add_edge("throttle_node", "model_node")
    
    return agent_builder.compile(checkpointer=checkpointer)
