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
from core.logging import worker_logger


async def fetch_inbox_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch pending messages from the thread inbox and append them to the message state.

    This node runs at the start of each iteration and after tool execution,
    allowing the agent to ingest new messages that arrived during processing.
    
    Uses EventLoader for event transformation. MCP/skill loading is handled
    by the executor at startup - this node focuses on message transformation.
    """
    existing_messages = state.get("messages", [])
    worker_logger.info(f"[fetch_inbox_node] Existing messages in state: {len(existing_messages)}")
    
    thread_id = state.get("thread_id")
    if not thread_id:
        worker_logger.warning("[fetch_inbox_node] No thread_id in state, skipping inbox check")
        return {"messages": [], "inbox_messages_added": 0}

    pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)
    
    worker_logger.info(f"[fetch_inbox_node] Pending messages in inbox: {len(pending_messages)}")

    if not pending_messages:
        if existing_messages:
            worker_logger.info(f"[fetch_inbox_node] No pending messages, keeping existing {len(existing_messages)} messages")
            return {"messages": [], "inbox_messages_added": 0}
        return {"messages": [], "inbox_messages_added": 0}

    worker_logger.info(
        f"[fetch_inbox_node] Found {len(pending_messages)} pending messages for thread {thread_id}"
    )

    available_skills = state.get("available_skills", [])
    loaded_skills = state.get("loaded_skills", [])
    loaded_skill_names = [s.get("name") for s in loaded_skills if s.get("name")]
    
    unique_event_types = list(set(msg["event_type"] for msg in pending_messages))
    worker_logger.info(f"[fetch_inbox_node] Event types: {unique_event_types}")

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
            worker_logger.info(
                f"[fetch_inbox_node] Transformed message: {event_type} -> {event_message.content[:100]}..."
            )
            new_messages.append(event_message)
            processed_ids.append(message_id)
        else:
            worker_logger.warning(
                f"[fetch_inbox_node] No transformer for event type: {event_type}"
            )
            new_messages.append(HumanMessage(content=f"Event received: {event_type}"))
            processed_ids.append(message_id)

    if processed_ids:
        await thread_inbox_repository.mark_processed(processed_ids)

    worker_logger.info(
        f"[fetch_inbox_node] Added {len(new_messages)} messages, skills loaded: {[s.get('name') for s in newly_loaded]}"
    )

    if existing_messages:
        worker_logger.info(f"[fetch_inbox_node] Replacing {len(existing_messages)} existing messages with {len(new_messages)} new messages")

    return {
        "messages": new_messages,
        "inbox_messages_added": len(new_messages),
        "loaded_skills": updated_loaded_skills,
    }