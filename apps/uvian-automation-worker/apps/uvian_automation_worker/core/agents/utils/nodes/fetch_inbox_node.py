from typing import Dict, Any, List
from langchain_core.messages import HumanMessage, ToolMessage
from repositories.thread_inbox import thread_inbox_repository
from executors.triggers import TriggerRegistry
from core.agents.utils.mcp_mapping import get_mcps_for_event
from core.agents.utils.skill_mapping import get_skills_for_event
from core.logging import worker_logger


async def fetch_inbox_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch pending messages from the thread inbox and append them to the message state.

    This node runs at the start of each iteration and after tool execution,
    allowing the agent to ingest new messages that arrived during processing.

    When new event types are discovered, it also injects ToolMessages to preload
    relevant MCPs and skills for those events.
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

    # Extract unique event types from pending messages
    event_types = list(set(msg["event_type"] for msg in pending_messages))
    worker_logger.info(f"[fetch_inbox_node] Event types: {event_types}")

    # Determine which MCPs and skills are relevant for these events
    all_mcp_configs = state.get("available_mcp_configs", [])
    all_skills = state.get("all_skills_list", [])
    already_loaded_mcps = set(state.get("loaded_mcps", []))
    already_loaded_skills = set(state.get("loaded_skills", []))

    preload_messages: List[ToolMessage] = []

    # Preload relevant MCPs
    if event_types and all_mcp_configs:
        relevant_mcp_configs = []
        for event_type in event_types:
            relevant_mcp_configs.extend(get_mcps_for_event(event_type, all_mcp_configs))
        seen = set()
        for cfg in relevant_mcp_configs:
            mcp_name = cfg.get("name", "")
            if mcp_name not in seen and mcp_name not in already_loaded_mcps:
                seen.add(mcp_name)
                preload_messages.append(ToolMessage(
                    content=f"Auto-loaded MCP server: {mcp_name}. This server provides tools for handling {event_type} events.",
                    tool_call_id=f"preload-mcp-{mcp_name}",
                ))

    # Preload relevant skills
    if event_types and all_skills:
        relevant_skills = []
        for event_type in event_types:
            relevant_skills.extend(get_skills_for_event(event_type, all_skills))
        seen_skills = set()
        for skill in relevant_skills:
            skill_name = skill.get("name", "")
            if skill_name not in seen_skills and skill_name not in already_loaded_skills:
                seen_skills.add(skill_name)
                content = skill.get("content", "")
                if isinstance(content, dict):
                    from core.agents.utils.skill_format import flatten_skill_content
                    content = flatten_skill_content(content)
                preload_messages.append(ToolMessage(
                    content=f"Loaded skill: {skill_name}\n\n{content}",
                    tool_call_id=f"preload-skill-{skill_name}",
                ))

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

    # Track what was loaded
    newly_loaded_mcps = [m.content.split(": ")[1].split(".")[0] if ": " in m.content else "" for m in preload_messages if m.tool_call_id.startswith("preload-mcp-")]
    newly_loaded_skills = [m.content.split(": ")[1].split("\n")[0] if ": " in m.content else "" for m in preload_messages if m.tool_call_id.startswith("preload-skill-")]

    return {
        "messages": preload_messages + new_messages,
        "inbox_messages_added": len(new_messages),
        "loaded_mcps": list(already_loaded_mcps | set(newly_loaded_mcps)),
        "loaded_skills": list(already_loaded_skills | set(newly_loaded_skills)),
    }
