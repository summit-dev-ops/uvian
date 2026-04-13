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


def transform_event(event_type: str, event_data: Dict[str, Any]) -> Optional[HumanMessage]:
    event_message = EventTransformerRegistry.create_message(event_type, event_data)
    
    if event_message:
        return HumanMessage(content=event_message.content)
    
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
        mcp_name = cfg.get("name", cfg.get("id", "unknown"))
        
        try:
            tools = await persistent_client.load_tools(cfg["id"])
            loaded_tools.extend(tools)
            info_messages.append(ToolMessage(
                content=f"Auto-loaded MCP server: {mcp_name}. This server provides tools for handling events.",
                tool_call_id=f"preload-mcp-{mcp_name}",
            ))
        except Exception as e:
            info_messages.append(ToolMessage(
                content=f"Failed to load MCP server: {mcp_name}. Error: {str(e)}",
                tool_call_id=f"preload-mcp-{mcp_name}",
            ))
    
    return info_messages, loaded_tools


async def prepare_for_inbox_events(
    pending_messages: List[Dict[str, Any]],
    skills: List[Dict[str, Any]],
    mcp_configs: List[Dict[str, Any]],
    persistent_client
) -> Tuple[List[HumanMessage], List[BaseTool], List[Dict[str, Any]], List[str], List[str]]:
    """Prepare all events from inbox - transform and load resources for all unique event types.
    
    Called by subscription node to process multiple pending inbox messages.
    Deduplicates event types and loads MCPs/skills once for all events.
    
    Args:
        pending_messages: List of pending messages from inbox
        skills: All available skills
        mcp_configs: All available MCP configurations
        persistent_client: PersistentMCPClient for MCP connections
        
    Returns:
        Tuple of (human_messages, mcp_tools, matched_skills, matched_mcp_names, processed_ids)
    """
    if not pending_messages:
        return [], [], [], [], []
    
    unique_event_types = list(set(msg["event_type"] for msg in pending_messages))
    
    matched_skills = filter_skills(unique_event_types, skills)
    
    matched_mcp_configs = filter_mcps(unique_event_types, mcp_configs)
    _, mcp_tools = await load_mcps(matched_mcp_configs, persistent_client)
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
    
    return human_messages, mcp_tools, matched_skills, matched_mcp_names, processed_ids