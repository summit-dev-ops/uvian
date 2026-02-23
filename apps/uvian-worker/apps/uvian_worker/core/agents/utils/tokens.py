from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from core.agents.utils.state import MessagesState

def count_tokens(messages: list, system_prompt: str = "") -> int:
    total_chars = sum(len(str(m.content)) for m in messages) + len(system_prompt)
    return total_chars // 4  # Rough: 4 chars/token

def check_context(state: MessagesState) -> str:
    """Decide whether to summarize or proceed to LLM"""
    MAX_TOKENS = 8192
    SAFETY_BUFFER = 500  # Reserve for output + tool calls
    TRIGGER_THRESHOLD = MAX_TOKENS - SAFETY_BUFFER
    
    # Get system prompt if present
    system_msgs = [m for m in state["messages"] if isinstance(m, SystemMessage)]
    system_prompt = system_msgs[0].content if system_msgs else ""
    
    current_tokens = count_tokens(state["messages"], system_prompt)
    
    if current_tokens > TRIGGER_THRESHOLD:
        print(f"⚠️  Context at {current_tokens}/{MAX_TOKENS} tokens → triggering summarization")
        return "summarize"
    return "llm_call"