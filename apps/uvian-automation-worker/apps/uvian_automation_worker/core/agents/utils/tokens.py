from langchain_core.messages import SystemMessage
from core.agents.utils.state import MessagesState

def count_tokens(messages: list, system_prompt: str = "") -> int:
    total_chars = sum(len(str(m.content)) for m in messages) + len(system_prompt)
    return total_chars // 4

def check_context(state: MessagesState) -> str:
    MAX_TOKENS = 124000
    SAFETY_BUFFER = 500
    TRIGGER_THRESHOLD = MAX_TOKENS - SAFETY_BUFFER

    context_size = state.get("session_context_size", 0)

    if context_size is None or context_size == 0:
        system_msgs = [m for m in state["messages"] if isinstance(m, SystemMessage)]
        system_prompt = system_msgs[0].content if system_msgs else ""

        compaction_state = state.get("compaction_state", {})
        message_offset = compaction_state.get("message_offset", 0)

        if message_offset > 0:
            visible_msgs = state["messages"][message_offset:]
            context_size = count_tokens(visible_msgs, system_prompt)
        else:
            context_size = count_tokens(state["messages"], system_prompt)

    if context_size > TRIGGER_THRESHOLD:
        return "compaction_node"
    return "model_node"