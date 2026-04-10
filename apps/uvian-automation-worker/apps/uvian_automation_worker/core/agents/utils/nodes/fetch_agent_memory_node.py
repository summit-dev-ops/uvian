"""Node to fetch agent memory from remote storage.

Runs at the start of agent execution and after tool execution to sync
memory from core_automation.agent_shared_memory table into agent state.
"""
import json
from typing import Dict, Any
from repositories.agent_memory import agent_memory_repository
from core.logging import log


async def fetch_agent_memory_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch all memory entries for the agent from remote storage.
    
    This node runs at startup and after tool execution to ensure the agent
    has the latest memory state available in its context.
    
    Args:
        state: The current agent state containing thread_id and other context
        
    Returns:
        Dictionary with agent_memory key containing all memory entries
    """
    thread_id = state.get("thread_id")
    agent_user_id = state.get("agent_user_id")
    llm_calls = state.get("llm_calls", 0)
    
    log.info(
        "fetching_agent_memory",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        node="fetch_agent_memory_node",
    )
    
    agent_user_id = state.get("agent_user_id")
    
    if not agent_user_id:
        return {"agent_memory": {}}
    
    memory = await agent_memory_repository.get_all_memory(agent_user_id)
    
    if memory:
        memory_keys = list(memory.keys())
    else:
        memory_keys = []
    
    log.debug(
        "agent_memory_fetched",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        node="fetch_agent_memory_node",
        extra={"memory_keys": memory_keys, "memory_count": len(memory_keys)},
    )
    
    return {"agent_memory": memory}
