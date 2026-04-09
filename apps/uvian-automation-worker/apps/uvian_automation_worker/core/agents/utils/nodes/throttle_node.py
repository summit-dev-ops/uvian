import asyncio
from core.agents.utils.state import MessagesState

THROTTLE_DELAY = 2.0

async def throttle_node(state: MessagesState) -> MessagesState:
    await asyncio.sleep(THROTTLE_DELAY)
    return {}
