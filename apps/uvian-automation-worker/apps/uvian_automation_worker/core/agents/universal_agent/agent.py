from typing import List, Any, Optional
from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.models import minimax_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.nodes.response_node import create_response_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.summarizer_node import create_summarize_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.tool_node import ToolNode
from langgraph.prebuilt import tools_condition
from langchain_core.tools import BaseTool


def build_agent(mcp_tools: Optional[List[BaseTool]] = None) -> Any:
    """Build the agent with given MCP tools.
    
    Args:
        mcp_tools: Optional list of MCP tools to include. If not provided,
                   only base_tools will be used.
    """
    tools = base_tools.copy()
    if mcp_tools:
        tools.extend(mcp_tools)

    checkpointer = PostgresAsyncCheckpointer()
    agent_builder = StateGraph(MessagesState)

    model_node = create_model_node(minimax_model, tools)
    response_node = create_response_node(minimax_model, tools)
    summarize_node = create_summarize_node(minimax_model, agent_name="DataBot")
    tool_node = ToolNode(tools)

    def check_context_node(state: MessagesState) -> MessagesState:
        return state

    agent_builder.add_node("check_context_node", check_context_node)
    agent_builder.add_node("model_node", model_node)
    agent_builder.add_node("response_node", response_node)
    agent_builder.add_node("tool_node", tool_node)
    agent_builder.add_node("summarize_node", summarize_node)

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
        {"tools": "tool_node", "__end__": "response_node"},
    )

    agent_builder.add_edge("tool_node", "model_node")
    agent_builder.add_edge("response_node", END)
    
    return agent_builder.compile(checkpointer=checkpointer)


agent = build_agent()
