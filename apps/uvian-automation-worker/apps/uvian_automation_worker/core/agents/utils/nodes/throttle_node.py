import asyncio
from core.agents.utils.state import MessagesState
from core.logging import worker_logger

THROTTLE_DELAY = 2.0

async def throttle_node(state: MessagesState) -> MessagesState:
    msg_count = len(state.get("messages", []))
    worker_logger.info(f"[throttle_node] ENTER (messages={msg_count})")
    worker_logger.info(f"[throttle_node] Pausing for {THROTTLE_DELAY}s to rate limit LLM calls")
    await asyncio.sleep(THROTTLE_DELAY)
    return {}
