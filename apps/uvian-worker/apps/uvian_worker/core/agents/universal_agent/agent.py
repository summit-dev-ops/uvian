from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools as base_tools
from core.agents.utils.tools.conversation_tools import tools as conversation_tools
from core.agents.utils.models.base_models import base_assistant_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.tokens import check_context
from core.agents.utils.nodes.summarizer_node import create_summarize_node
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer
from core.agents.utils.nodes.tool_node import ToolNode
from langgraph.prebuilt import tools_condition

tools = base_tools + conversation_tools

checkpointer = PostgresAsyncCheckpointer()
agent_builder = StateGraph(MessagesState)

llm_call = create_model_node(base_assistant_model, tools)
summarize_node = create_summarize_node(base_assistant_model, agent_name="DataBot")
tool_node = ToolNode(tools)

# Add the check_context node itself (it's a function, not a state-modifying node)
# Option: make it a passthrough node that just returns state + route decision
def check_context_node(state: MessagesState) -> MessagesState:
    # Just return state; routing is handled by check_context function
    return state

agent_builder.add_node("check_context", check_context_node)
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tools", tool_node)
agent_builder.add_node("summarize", summarize_node)

# Edges
agent_builder.add_edge(START, "check_context")  # New entry point
agent_builder.add_edge("summarize", "llm_call")

# Conditional routing from context check
agent_builder.add_conditional_edges(
    "check_context",  # You'll need to add this node or use a function
    check_context,
    {
        "summarize": "summarize",
        "llm_call": "llm_call"
    }
)

agent_builder.add_conditional_edges(
    "llm_call",
    tools_condition,
    {"tools": "tools", "__end__": END},
)

agent_builder.add_edge("tools", "llm_call")

agent = agent_builder.compile(checkpointer=checkpointer)
