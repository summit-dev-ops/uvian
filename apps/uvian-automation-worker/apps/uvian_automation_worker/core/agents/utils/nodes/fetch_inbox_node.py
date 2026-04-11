"""Subscription node - fetches pending messages from the thread inbox.

Part of the agent graph, this node runs at the start of each iteration and after
tool execution to check for new messages that arrived during processing.

Uses EventLoader for transforming events to HumanMessages. MCP and skill loading
is handled by the executor at startup - this node focuses on message transformation.
"""
from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from repositories.thread_inbox import thread_inbox_repository
from core.agents.utils.loader import transform_event, filter_skills
from core.logging import log


async def fetch_inbox_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch pending messages from the thread inbox and append them to the message state.

    This node runs at the start of each iteration and after tool execution,
    allowing the agent to ingest new messages that arrived during processing.
    
    Uses EventLoader for event transformation. MCP/skill loading is handled
    by the executor at startup - this node focuses on message transformation.
    """
    thread_id = state.get("thread_id")
    agent_user_id = state.get("agent_user_id")
    llm_calls = state.get("llm_calls", 0)
    execution_id = state.get("execution_id", "unknown")
    
    existing_messages = state.get("messages", [])
    
    if not thread_id:
        return {}

    log.debug(
        "fetching_inbox_messages",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        execution_id=execution_id,
        node="fetch_inbox_node",
        extra={"existing_message_count": len(existing_messages)},
    )

    pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
    
    if not pending_messages:
        return {}

    available_skills = state.get("available_skills", [])
    loaded_skills = state.get("loaded_skills", [])
    loaded_skill_names = [s.get("name") for s in loaded_skills if s.get("name")]
    
    unique_event_types = list(set(msg["event_type"] for msg in pending_messages))

    matched_skills = filter_skills(unique_event_types, available_skills)
    
    newly_loaded = []
    for s in matched_skills:
        if s.get("name") and s["name"] not in loaded_skill_names:
            newly_loaded.append({
                "name": s.get("name"),
                "description": s.get("description", ""),
                "content": s.get("content", "")
            })
    
    updated_loaded_skills = loaded_skills + newly_loaded

    new_messages: List[HumanMessage] = []
    processed_ids: List[str] = []

    for msg_data in pending_messages:
        event_type = msg_data["event_type"]
        payload = msg_data["payload"]
        message_id = msg_data["id"]

        event_message = transform_event(event_type, payload)
        
        if event_message:
            new_messages.append(event_message)
            processed_ids.append(message_id)
        else:
            new_messages.append(HumanMessage(content=f"Event received: {event_type}"))
            processed_ids.append(message_id)

    if processed_ids:
        await thread_inbox_repository.mark_processed(processed_ids)

    log.info(
        "inbox_messages_fetched",
        thread_id=thread_id,
        agent_user_id=agent_user_id,
        llm_calls=llm_calls,
        execution_id=execution_id,
        node="fetch_inbox_node",
        extra={
            "messages_added": len(new_messages),
            "event_types": unique_event_types,
            "new_skills_loaded": [s.get("name") for s in newly_loaded],
        },
    )

    return {
        "messages": new_messages,
        "inbox_messages_added": len(new_messages),
        "loaded_skills": updated_loaded_skills,
    }