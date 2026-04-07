"""Composable event processing module.

Provides unified functions for:
- Event-to-message transformation using EventTransformerRegistry
- Skill loading based on event types
- MCP loading (filtering + connecting + loading tools) based on event types

Used by both the executor (initial event processing) and the subscription node (inbox processing).
"""
from typing import List, Dict, Any, Tuple, Optional
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import BaseTool

from core.agents.event_transformers import EventTransformerRegistry, EventMessage
from core.agents.utils.skill_mapping import get_skills_for_event
from core.agents.utils.mcp_mapping import get_mcps_for_event
from core.agents.utils.tools.base_tools import flatten_skill_content
from core.logging import worker_logger


def transform_event(event_type: str, event_data: Dict[str, Any]) -> Optional[HumanMessage]:
    """Transform event data into a HumanMessage using EventTransformerRegistry.
    
    Args:
        event_type: The type of event (e.g., 'message.created')
        event_data: The event payload data
        
    Returns:
        HumanMessage with AI-readable content, or None if no transformer found
    """
    event_message = EventTransformerRegistry.create_message(event_type, event_data)
    
    if event_message:
        return HumanMessage(content=event_message.content)
    
    worker_logger.warning(f"[EventLoader] No transformer found for event type: {event_type}")
    return HumanMessage(content=f"Event received: {event_type}")


def filter_skills(event_types: List[str], skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter skills that match any of the given event types.
    
    Args:
        event_types: List of event types to match against
        skills: List of all available skills
        
    Returns:
        List of skills that have matching auto_load_events
    """
    if not event_types or not skills:
        return []
    
    matched_skills = []
    seen = set()
    
    for event_type in event_types:
        for skill in get_skills_for_event(event_type, skills):
            skill_name = skill.get("name", "")
            if skill_name and skill_name not in seen:
                seen.add(skill_name)
                matched_skills.append(skill)
    
    return matched_skills


def filter_mcps(event_types: List[str], mcp_configs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter MCP configs that match any of the given event types.
    
    Args:
        event_types: List of event types to match against
        mcp_configs: List of all available MCP configurations
        
    Returns:
        List of MCP configs that have matching auto_load_events
    """
    if not event_types or not mcp_configs:
        return []
    
    matched_configs = []
    seen = set()
    
    for event_type in event_types:
        for cfg in get_mcps_for_event(event_type, mcp_configs):
            cfg_id = cfg.get("id", "")
            if cfg_id and cfg_id not in seen:
                seen.add(cfg_id)
                matched_configs.append(cfg)
    
    return matched_configs


def prepare_skill_messages(skills: List[Dict[str, Any]]) -> List[ToolMessage]:
    """Create ToolMessages for skill contents.
    
    Args:
        skills: List of skills to create messages for
        
    Returns:
        List of ToolMessages containing skill contents
    """
    messages = []
    
    for skill in skills:
        skill_name = skill.get("name", "unknown")
        content = skill.get("content", {})
        
        if isinstance(content, dict):
            formatted_content = flatten_skill_content(content)
        elif isinstance(content, str):
            formatted_content = content
        else:
            formatted_content = str(content)
        
        messages.append(ToolMessage(
            content=f"Loaded skill: {skill_name}\n\n{formatted_content}",
            tool_call_id=f"preload-skill-{skill_name}",
        ))
    
    return messages


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
    
    worker_logger.info(f"[EventLoader] Loading {len(mcp_configs)} MCPs: {[c.get('name') for c in mcp_configs]}")
    
    for cfg in mcp_configs:
        mcp_name = cfg.get("name", cfg.get("id", "unknown"))
        
        try:
            tools = await persistent_client.load_tools(cfg["id"])
            loaded_tools.extend(tools)
            info_messages.append(ToolMessage(
                content=f"Auto-loaded MCP server: {mcp_name}. This server provides tools for handling events.",
                tool_call_id=f"preload-mcp-{mcp_name}",
            ))
            worker_logger.info(f"[EventLoader] Loaded {len(tools)} tools from MCP: {mcp_name}")
        except Exception as e:
            worker_logger.warning(f"[EventLoader] Failed to load MCP {mcp_name}: {e}")
            info_messages.append(ToolMessage(
                content=f"Failed to load MCP server: {mcp_name}. Error: {str(e)}",
                tool_call_id=f"preload-mcp-{mcp_name}",
            ))
    
    return info_messages, loaded_tools


async def prepare_for_events(
    event_type: str,
    event_data: Dict[str, Any],
    skills: List[Dict[str, Any]],
    mcp_configs: List[Dict[str, Any]],
    persistent_client
) -> Tuple[HumanMessage, List[ToolMessage], List[BaseTool], List[str], List[str]]:
    """Composed function: transform event and load related MCPs/skills.
    
    This is the main entry point that combines:
    1. Event -> HumanMessage transformation
    2. Skills filtering and preload messages
    3. MCPs filtering and tool loading
    
    Args:
        event_type: The type of event
        event_data: The event payload
        skills: All available skills
        mcp_configs: All available MCP configurations
        persistent_client: PersistentMCPClient for MCP connections
        
    Returns:
        Tuple of (human_message, preload_messages, mcp_tools, matched_skill_names, matched_mcp_names)
    """
    event_message = transform_event(event_type, event_data)
    
    matched_skills = filter_skills([event_type], skills)
    skill_messages = prepare_skill_messages(matched_skills)
    matched_skill_names = [s.get("name", "") for s in matched_skills if s.get("name")]
    
    matched_mcp_configs = filter_mcps([event_type], mcp_configs)
    mcp_messages, mcp_tools = await load_mcps(matched_mcp_configs, persistent_client)
    matched_mcp_names = [c.get("name", c.get("id", "")) for c in matched_mcp_configs]
    
    preload_messages = skill_messages + mcp_messages
    
    worker_logger.info(
        f"[EventLoader] Prepared event: {event_type}, "
        f"skills={len(matched_skills)}, mcps={len(matched_mcp_configs)}, tools={len(mcp_tools)}"
    )
    
    return event_message, preload_messages, mcp_tools, matched_skill_names, matched_mcp_names


async def prepare_for_inbox_events(
    pending_messages: List[Dict[str, Any]],
    skills: List[Dict[str, Any]],
    mcp_configs: List[Dict[str, Any]],
    persistent_client
) -> Tuple[List[HumanMessage], List[ToolMessage], List[BaseTool], List[str], List[str], List[str]]:
    """Prepare all events from inbox - transform and load resources for all unique event types.
    
    Called by subscription node to process multiple pending inbox messages.
    Deduplicates event types and loads MCPs/skills once for all events.
    
    Args:
        pending_messages: List of pending messages from inbox
        skills: All available skills
        mcp_configs: All available MCP configurations
        persistent_client: PersistentMCPClient for MCP connections
        
    Returns:
        Tuple of (human_messages, preload_messages, mcp_tools, processed_message_ids, matched_skill_names, matched_mcp_names)
    """
    if not pending_messages:
        return [], [], [], [], [], []
    
    unique_event_types = list(set(msg["event_type"] for msg in pending_messages))
    worker_logger.info(f"[EventLoader] Processing {len(pending_messages)} messages, event types: {unique_event_types}")
    
    matched_skills = filter_skills(unique_event_types, skills)
    skill_messages = prepare_skill_messages(matched_skills)
    matched_skill_names = [s.get("name", "") for s in matched_skills if s.get("name")]
    
    matched_mcp_configs = filter_mcps(unique_event_types, mcp_configs)
    mcp_messages, mcp_tools = await load_mcps(matched_mcp_configs, persistent_client)
    matched_mcp_names = [c.get("name", c.get("id", "")) for c in matched_mcp_configs]
    
    preload_messages = skill_messages + mcp_messages
    
    human_messages = []
    processed_ids = []
    
    for msg_data in pending_messages:
        event_type = msg_data["event_type"]
        payload = msg_data["payload"]
        message_id = msg_data["id"]
        
        event_message = transform_event(event_type, payload)
        human_messages.append(event_message)
        processed_ids.append(message_id)
    
    worker_logger.info(
        f"[EventLoader] Prepared inbox: {len(unique_event_types)} event types, "
        f"skills={len(matched_skills)}, mcps={len(matched_mcp_configs)}, tools={len(mcp_tools)}"
    )
    
    return human_messages, preload_messages, mcp_tools, processed_ids, matched_skill_names, matched_mcp_names