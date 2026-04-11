import asyncio
from core.agents.utils.state import MessagesState
from core.logging import log

THROTTLE_DELAY = 2.0

async def throttle_node(state: MessagesState) -> MessagesState:
    thread_id = state.get("thread_id")
    agent_user_id = state.get("agent_user_id")
    llm_calls = state.get("llm_calls", 0)
    execution_id = state.get("execution_id", "unknown")
    
    log.debug(
        "throttle_node_sleeping",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        execution_id=execution_id,
        node="throttle_node",
        extra={"sleep_seconds": THROTTLE_DELAY},
    )
    
    await asyncio.sleep(THROTTLE_DELAY)
    return {}
