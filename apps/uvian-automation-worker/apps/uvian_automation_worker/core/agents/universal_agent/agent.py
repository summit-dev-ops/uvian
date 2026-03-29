from typing import List, Any, Optional, Dict
from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from langgraph.types import RunnableConfig
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.models import create_minimax_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.summarizer_node import create_summarize_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.tool_node import ToolNode
from langgraph.prebuilt import tools_condition
from langchain_core.tools import BaseTool
from core.logging import worker_logger


def get_thread_id_from_config(config: RunnableConfig) -> str:
    return config.get("configurable", {}).get("thread_id", "unknown")


def create_logging_wrapper(node_name: str, original_node):
    """Wrap a node function with logging."""
    def logged_node(state: MessagesState, config: RunnableConfig) -> Any:
        thread_id = get_thread_id_from_config(config)
        msg_count = len(state.get("messages", []))
        worker_logger.info(f"[thread:{thread_id}] {node_name}: ENTER (messages={msg_count})")
        try:
            result = original_node(state)
            if isinstance(result, dict):
                result_msg_count = len(result.get("messages", []))
                worker_logger.info(f"[thread:{thread_id}] {node_name}: EXIT (messages={result_msg_count})")
            else:
                worker_logger.info(f"[thread:{thread_id}] {node_name}: EXIT")
            return result
        except Exception as e:
            worker_logger.error(f"[thread:{thread_id}] {node_name}: ERROR - {type(e).__name__}: {str(e)}")
            raise
    return logged_node


def build_agent(
    mcp_tools: Optional[List[BaseTool]] = None,
    llm_config: Optional[Dict[str, Any]] = None,
) -> Any:
    tools = base_tools.copy()
    if mcp_tools:
        tools.extend(mcp_tools)
        worker_logger.info(f"Agent built with {len(tools)} tools: {[t.name for t in tools]}")

    llm_cfg = llm_config or {}
    llm = create_minimax_model(llm_cfg)

    checkpointer = PostgresAsyncCheckpointer()
    agent_builder = StateGraph(MessagesState)

    # Create node functions
    raw_model_node = create_model_node(llm, tools)
    raw_summarize_node = create_summarize_node(llm, agent_name="DataBot")
    raw_tool_node = ToolNode(tools)

    def check_context_node(state: MessagesState) -> MessagesState:
        """Check context and decide routing."""
        worker_logger.info(f"check_context_node: Checking context")
        result = check_context(state)
        worker_logger.info(f"check_context_node: Routing to '{result}'")
        return state

    def model_node_with_logging(state: MessagesState) -> Any:
        """Model node with logging."""
        worker_logger.info(f"model_node: ENTER (messages={len(state.get('messages', []))})")
        try:
            result = raw_model_node(state)
            messages = result.get("messages", [])
            tool_calls = []
            if messages:
                last_msg = messages[-1]
                if hasattr(last_msg, "tool_calls"):
                    tool_calls = last_msg.tool_calls or []
            worker_logger.info(f"model_node: EXIT (llm_calls={result.get('llm_calls', 0)}, tool_calls={len(tool_calls)})")
            return result
        except Exception as e:
            worker_logger.error(f"model_node: ERROR - {type(e).__name__}: {str(e)}")
            raise

    def tool_node_with_logging(state: MessagesState) -> Any:
        """Tool node with logging."""
        worker_logger.info(f"tool_node: ENTER (messages={len(state.get('messages', []))})")
        try:
            result = raw_tool_node(state)
            worker_logger.info(f"tool_node: EXIT")
            return result
        except Exception as e:
            worker_logger.error(f"tool_node: ERROR - {type(e).__name__}: {str(e)}")
            raise

    def summarize_node_with_logging(state: MessagesState) -> Any:
        """Summarize node with logging."""
        worker_logger.info(f"summarize_node: ENTER (messages={len(state.get('messages', []))})")
        try:
            result = raw_summarize_node(state)
            worker_logger.info(f"summarize_node: EXIT")
            return result
        except Exception as e:
            worker_logger.error(f"summarize_node: ERROR - {type(e).__name__}: {str(e)}")
            raise

    def tools_condition_with_logging(state: MessagesState) -> str:
        """Tools condition with logging."""
        result = tools_condition(state)
        messages = state.get("messages", [])
        tool_calls = []
        if messages:
            last_msg = messages[-1]
            if hasattr(last_msg, "tool_calls"):
                tool_calls = last_msg.tool_calls or []
        worker_logger.info(f"tools_condition: Routing to '{result}' (tool_calls={len(tool_calls)})")
        return result

    agent_builder.add_node("check_context_node", check_context_node)
    agent_builder.add_node("model_node", model_node_with_logging)
    agent_builder.add_node("tool_node", tool_node_with_logging)
    agent_builder.add_node("summarize_node", summarize_node_with_logging)

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
        tools_condition_with_logging,
        {"tools": "tool_node", "__end__": END},
    )

    agent_builder.add_edge("tool_node", "model_node")
    
    return agent_builder.compile(checkpointer=checkpointer)
