from core.agents.utils.state import MessagesState
from langgraph.graph import StateGraph, START, END
from core.agents.utils.tools.base_tools import tools_by_name, tools
from core.agents.utils.models.base_models import base_assistant_model
from core.agents.utils.nodes.model_node import create_model_node
from core.agents.utils.nodes.tool_node import create_tool_node
from core.agents.utils.edges.should_continue import should_continue
from core.agents.utils.memory.base_memory import PostgresAsyncCheckpointer

checkpointer = PostgresAsyncCheckpointer()
agent_builder = StateGraph(MessagesState)

tool_node = create_tool_node(tools_by_name)
llm_call = create_model_node(base_assistant_model, tools)


agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    ["tool_node", END]
)

agent_builder.add_edge("tool_node", "llm_call")

agent = agent_builder.compile(checkpointer=checkpointer)
