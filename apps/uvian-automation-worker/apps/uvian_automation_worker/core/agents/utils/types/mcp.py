"""MCP domain types for the agent system.

This module provides TypedDict definitions for MCP-related data structures
used across the agent codebase.
"""

from typing import TypedDict, NotRequired


class MCPToolMetadata(TypedDict):
    """Metadata for an MCP tool."""
    name: str
    description: str


class MCPServerConfig(TypedDict):
    """Configuration for an MCP server from secrets/database.
    
    This represents the full connection configuration including
    authentication details.
    """
    id: str
    name: str
    url: str
    auth_method: str
    auth_secret: str | None
    jwt_secret: str | None
    usage_guidance: str | None
    transport: str | None


class LoadedMCP(TypedDict):
    """An MCP server that has been loaded into the agent's toolset.
    
    Stored in agent state under 'loaded_mcps'. The 'tools' field contains
    metadata about available tools from this MCP server.
    """
    name: str
    description: str
    tools: list[MCPToolMetadata]


class AvailableMCP(TypedDict):
    """An MCP server available to be loaded.
    
    Presented to the agent in system prompts. The optional 'tool_names'
    field can be populated with cached tool names for display purposes.
    """
    id: str
    name: str
    description: str
    tool_names: NotRequired[list[str]]


class RawMCPServerConfig(TypedDict, total=False):
    """Raw MCP server config as stored in secrets/database.
    
    Some fields may be missing or have different formats depending on
    how the config is stored.
    """
    id: str
    name: str
    url: str
    usage_guidance: str
    auth_method: str
    auth_secret: str | None
    jwt_secret: str | None
    transport: str | None