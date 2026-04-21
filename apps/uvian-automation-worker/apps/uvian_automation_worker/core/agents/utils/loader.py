"""Composable event processing module.

Provides unified functions for:
- Event-to-message transformation using EventTransformerRegistry
- Hook-based loading (skills + MCPs) based on event types

Used by both the executor (initial event processing) and the subscription node (inbox processing).
"""
from typing import List, Dict, Any, Tuple, Optional
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import BaseTool

from core.agents.event_transformers import EventTransformerRegistry
from core.agents.utils.tools.base_tools import flatten_skill_content


def is_self_action(event_data: Dict[str, Any], agent_user_id: str) -> bool:
    """Check if the event was triggered by the agent itself."""
    actor_id = event_data.get("actorId")
    return actor_id == agent_user_id

def transform_event(
    event_type: str,
    event_data: Dict[str, Any],
    agent_user_id: Optional[str] = None,
) -> Optional[HumanMessage]:
    is_self = agent_user_id and is_self_action(event_data, agent_user_id)
    
    event_message = EventTransformerRegistry.create_message(
        event_type, event_data, is_self_action=is_self
    )
    
    if event_message:
        return HumanMessage(content=event_message.content)
    
    prefix = "You" if is_self else "Event"
    return HumanMessage(content=f"{prefix} received: {event_type}")


def _match_event_pattern(event_type: str, patterns: List[str]) -> bool:
    """Match event type against patterns (supports exact match and prefix)."""
    for pattern in patterns:
        if event_type == pattern or event_type.startswith(pattern):
            return True
    return False


def get_hooks_for_event(
    event_type: str,
    hooks: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """Filter hooks matching event type and extract MCPs/skills to load.
    
    Args:
        event_type: Event type to match (e.g., "com.uvian.message.created")
        hooks: List of hooks from v_agent_hooks_for_worker view
        
    Returns:
        Dict with 'load_mcp' and 'load_skill' lists of configs to load
    """
    if not event_type or not hooks:
        return {"load_mcp": [], "load_skill": []}
    
    mcps_to_load = []
    skills_to_load = []
    seen_mcps = set()
    seen_skills = set()
    
    for hook in hooks:
        trigger_json = hook.get("trigger_json", {})
        trigger_type = trigger_json.get("type")
        
        if trigger_type == "event":
            patterns = trigger_json.get("patterns", [])
            if _match_event_pattern(event_type, patterns):
                effect_type = hook.get("effect_type")
                effect_id = hook.get("effect_id")
                
                if effect_type == "load_mcp" and effect_id and effect_id not in seen_mcps:
                    seen_mcps.add(effect_id)
                    mcps_to_load.append({"effect_id": effect_id, "hook_name": hook.get("name")})
                
                elif effect_type == "load_skill" and effect_id and effect_id not in seen_skills:
                    seen_skills.add(effect_id)
                    skills_to_load.append({"effect_id": effect_id, "hook_name": hook.get("name")})
    
    return {
        "load_mcp": mcps_to_load,
        "load_skill": skills_to_load,
    }


async def load_mcps(
    mcp_configs: List[Dict[str, Any]],
    persistent_client
) -> Tuple[List[ToolMessage], List[BaseTool]]:
    """Filter, connect, and load tools from MCP servers.
    
    Args:
        mcp_configs: List of MCP configurations to load
        persistent_client: PersistentMCPClient instance for connection management
        
    Returns:
        Tuple of (info_messages, loaded_tools)
    """
    if not mcp_configs:
        return [], []
    
    info_messages = []
    loaded_tools = []
    
    for cfg in mcp_configs:
        mcp_id = cfg.get("id", cfg.get("mcp_id", "unknown"))
        
        try:
            tools = await persistent_client.load_tools(mcp_id)
            loaded_tools.extend(tools)
            info_messages.append(ToolMessage(
                content=f"Auto-loaded MCP server. This server provides tools for handling events.",
                tool_call_id=f"preload-mcp-{mcp_id}",
            ))
        except Exception as e:
            info_messages.append(ToolMessage(
                content=f"Failed to load MCP server: {mcp_id}. Error: {str(e)}",
                tool_call_id=f"preload-mcp-{mcp_id}",
            ))
    
    return info_messages, loaded_tools


async def prepare_for_inbox_events(
    pending_messages: List[Dict[str, Any]],
    skills: List[Dict[str, Any]],
    mcp_configs: List[Dict[str, Any]],
    hooks: List[Dict[str, Any]],
    persistent_client
) -> Tuple[List[HumanMessage], List[Dict[str, Any]], List[str], List[str]]:
    """Prepare all events from inbox - transform and load resources for all unique event types.
    
    Called by subscription node to process multiple pending inbox messages.
    Deduplicates event types and loads MCPs/skills once for all events.
    
    Args:
        pending_messages: List of pending messages from inbox
        skills: All available skills
        mcp_configs: All available MCP configurations
        hooks: All available hooks from v_agent_hooks_for_worker
        persistent_client: PersistentMCPClient for MCP connections
        
    Returns:
        Tuple of (human_messages, matched_skills, matched_mcp_names, processed_ids)
    """
    if not pending_messages:
        return [], [], [], []
    
    unique_event_types = list(set(msg["event_type"] for msg in pending_messages))
    
    hooks_by_effect = {"load_mcp": [], "load_skill": []}
    for event_type in unique_event_types:
        hooks_result = get_hooks_for_event(event_type, hooks)
        if hooks_result["load_mcp"]:
            hooks_by_effect["load_mcp"].extend(hooks_result["load_mcp"])
        if hooks_result["load_skill"]:
            hooks_by_effect["load_skill"].extend(hooks_result["load_skill"])
    
    mcp_ids_to_load = [h.get("effect_id") for h in hooks_by_effect["load_mcp"] if h.get("effect_id")]
    matched_mcp_configs = [c for c in mcp_configs if c.get("id") in mcp_ids_to_load]
    
    skill_ids_to_load = [h.get("effect_id") for h in hooks_by_effect["load_skill"] if h.get("effect_id")]
    matched_skills = [s for s in skills if s.get("id") in skill_ids_to_load]
    
    _, _ = await load_mcps(matched_mcp_configs, persistent_client)
    matched_mcp_names = [c.get("name", c.get("id", "")) for c in matched_mcp_configs]
    
    human_messages = []
    processed_ids = []
    
    for msg_data in pending_messages:
        event_type = msg_data["event_type"]
        payload = msg_data["payload"]
        message_id = msg_data["id"]
        
        event_message = transform_event(event_type, payload)
        human_messages.append(event_message)
        processed_ids.append(message_id)
    
    return human_messages, matched_skills, matched_mcp_names, processed_ids