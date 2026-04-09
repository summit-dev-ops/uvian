from langchain_core.messages import SystemMessage
from core.agents.utils.state import MessagesState

def count_tokens(messages: list, system_prompt: str = "") -> int:
    total_chars = sum(len(str(m.content)) for m in messages) + len(system_prompt)
    return total_chars // 4

def check_context(state: MessagesState) -> str:
    MAX_TOKENS = 8192
    SAFETY_BUFFER = 500
    TRIGGER_THRESHOLD = MAX_TOKENS - SAFETY_BUFFER
    
    system_msgs = [m for m in state["messages"] if isinstance(m, SystemMessage)]
    system_prompt = system_msgs[0].content if system_msgs else ""
    
    current_tokens = count_tokens(state["messages"], system_prompt)
    
    if current_tokens > TRIGGER_THRESHOLD:
        return "summarize_node"
    return "model_node"