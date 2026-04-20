from core.agents.utils.state import MessagesState

def check_context(state: MessagesState) -> str:
    MAX_TOKENS = 124000
    SAFETY_BUFFER = 500
    TRIGGER_THRESHOLD = MAX_TOKENS - SAFETY_BUFFER

    context_size = state.get("session_context_size", 0)

    if context_size > TRIGGER_THRESHOLD:
        return "compaction_node"
    return "model_node"