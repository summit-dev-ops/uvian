from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from repositories.thread_inbox import thread_inbox_repository
from executors.triggers import TriggerRegistry
from core.logging import worker_logger


async def fetch_inbox_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch pending messages from the thread inbox and append them to the message state.

    This node runs at the start of each iteration and after tool execution,
    allowing the agent to ingest new messages that arrived during processing.
    """
    thread_id = state.get("thread_id")
    if not thread_id:
        worker_logger.warning("[fetch_inbox_node] No thread_id in state, skipping inbox check")
        return {"inbox_messages_added": 0}

    pending_messages = await thread_inbox_repository.fetch_pending_messages(thread_id)

    if not pending_messages:
        return {"inbox_messages_added": 0}

    worker_logger.info(
        f"[fetch_inbox_node] Found {len(pending_messages)} pending messages for thread {thread_id}"
    )

    new_messages: List[HumanMessage] = []
    processed_ids: List[str] = []

    for msg_data in pending_messages:
        event_type = msg_data["event_type"]
        payload = msg_data["payload"]
        message_id = msg_data["id"]

        trigger_message = TriggerRegistry.create_message(event_type, payload)

        if trigger_message:
            content = trigger_message.content
            worker_logger.info(
                f"[fetch_inbox_node] Parsed message: {event_type} -> {content[:100]}..."
            )
            new_messages.append(HumanMessage(content=content))
            processed_ids.append(message_id)
        else:
            worker_logger.warning(
                f"[fetch_inbox_node] No trigger for event type: {event_type}"
            )
            new_messages.append(HumanMessage(content=f"Event received: {event_type}"))
            processed_ids.append(message_id)

    if processed_ids:
        await thread_inbox_repository.mark_processed(processed_ids)

    return {
        "messages": new_messages,
        "inbox_messages_added": len(new_messages),
    }
