from core.agents.utils.state import MessagesState
from typing import Optional

def check_context(state: MessagesState, max_context_size: Optional[int] = None) -> str:
    SAFETY_BUFFER = 500
    
    if max_context_size is None:
        max_context_size = state.get("max_context_size", 200000)
    
    trigger_threshold = max_context_size - SAFETY_BUFFER

    context_size = state.get("session_context_size", 0)

    if context_size > trigger_threshold:
        return "compaction_node"
    return "model_node"