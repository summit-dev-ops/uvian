from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.tools.conversation_tools import tools as conversation_tools, send_response_message
from core.agents.utils.models.base_models import base_assistant_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.nodes.response_node import create_response_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.summarizer_node import create_summarize_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.tool_node import ToolNode
from langgraph.prebuilt import tools_condition

tools = base_tools + conversation_tools

checkpointer = PostgresAsyncCheckpointer()
agent_builder = StateGraph(MessagesState)

model_node = create_model_node(base_assistant_model, tools)
response_node = create_response_node(base_assistant_model)
summarize_node = create_summarize_node(base_assistant_model, agent_name="DataBot")
tool_node = ToolNode(tools)
response_tool_node = ToolNode([send_response_message])

# Add the check_context node itself (it's a function, not a state-modifying node)
# Option: make it a passthrough node that just returns state + route decision
def check_context_node(state: MessagesState) -> MessagesState:
    # Just return state; routing is handled by check_context function
    return state


agent_builder.add_node("check_context_node", check_context_node)
agent_builder.add_node("model_node", model_node)
agent_builder.add_node("response_node", response_node)
agent_builder.add_node("tool_node", tool_node)
agent_builder.add_node("response_tool_node", response_tool_node)
agent_builder.add_node("summarize_node", summarize_node)

# Edges
agent_builder.add_edge(START, "check_context_node")  # New entry point
agent_builder.add_edge("summarize_node", "model_node")

# Conditional routing from context check
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
agent_builder.add_edge("response_node", "response_tool_node")
agent_builder.add_edge("response_tool_node", END)
agent = agent_builder.compile(checkpointer=checkpointer)
