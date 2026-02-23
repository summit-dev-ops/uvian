from typing import Literal
from langgraph.graph import StateGraph, START, END
from core.agents.utils.state import MessagesState

def should_continue(state: MessagesState) -> Literal["tools", END]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]

    # If the LLM makes a tool call, then perform an action
    if last_message.tool_calls:
        return "tools"

    # Otherwise, we stop (reply to the user)
    return END