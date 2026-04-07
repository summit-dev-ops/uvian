from langchain.tools import tool, ToolRuntime
from langgraph.types import Command
from langchain_core.messages import ToolMessage
from core.logging import worker_logger


def flatten_skill_content(content: dict, prefix: str = "") -> str:
    """Flatten nested JSON skill content into readable text with path-like headers."""
    lines = []
    for key, value in content.items():
        path = f"{prefix}/{key}" if prefix else key
        if isinstance(value, dict):
            lines.append(flatten_skill_content(value, path))
        elif isinstance(value, list):
            lines.append(f"## {path}\n")
            for item in value:
                if isinstance(item, dict):
                    lines.append(flatten_skill_content(item, path))
                else:
                    lines.append(f"- {item}")
            lines.append("")
        else:
            lines.append(f"## {path}\n{value}\n")
    return "\n".join(lines)


search_skills_schema = {
    "type": "object",
    "properties": {
        "query": {"type": "string"},
    },
    "required": ["query"]
}

@tool(args_schema=search_skills_schema)
def search_skills(
    runtime: ToolRuntime | None = None, **kargs) -> str:
    """Search for skills in the skill database

    Skills are predefined patterns of behaviour you can use to expand you abilities in processing requests. Use this tool when you are lacking in ability to perform some request to see what skills are available that can help you to perform better at the request.

    Args:
        query: simple query string you associate with the request you have: (copy writing, roleplaying, pricing strategy)
    """
    worker_logger.info(f"[search_skills] Called with query: {kargs.get('query')}")

    skills = runtime.state.get("skills")
    available = ", ".join(s["name"] for s in skills)
    return f"Available skills: {available}"


load_skill_schema = {
    "type": "object",
    "properties": {
        "skill_name": {"type": "string"},
    },
    "required": ["skill_name"]
}
@tool(args_schema=load_skill_schema)
def load_skill(
    runtime: ToolRuntime | None = None, **kargs) -> Command:
    """Load the full content of a skill into the agent's context.

    Use this when you need detailed information about how to handle a specific
    type of request. This will provide you with comprehensive instructions,
    policies, and guidelines for the skill area.

    Args:
        skill_name: The name of the skill to load (e.g., "expense_reporting", "travel_booking")
    """
    loaded_skills = runtime.state.get("loaded_skills") or []
    available_skills = runtime.state.get("available_skills") or []
    loaded_skill_names = [s.get("name") for s in loaded_skills if isinstance(s, dict) and s.get("name")]
    skill_name = kargs["skill_name"]
    
    skill_info = next((s for s in available_skills if s.get("name", "").lower() == skill_name.lower()), None)
    
    if not skill_info:
        available = ", ".join(s.get("name", "unknown") for s in available_skills)
        worker_logger.info(f"[load_skill] Skill not found: {skill_name}")
        return Command(update={
            "messages": [ToolMessage(
                f"Skill '{skill_name}' not found. Available skills: {available}",
                tool_call_id=runtime.tool_call_id
            )]
        })
    
    skill_name_found = skill_info.get("name", "")
    
    if skill_name_found in loaded_skill_names:
        worker_logger.info(f"[load_skill] Skill already loaded: {skill_name_found}")
        return Command(update={
            "messages": [ToolMessage(
                f"Skill '{skill_name_found}' is already loaded.",
                tool_call_id=runtime.tool_call_id
            )]
        })
    
    worker_logger.info(f"[load_skill] Loading skill: {skill_name_found}")
    
    from core.agents.utils.tools.base_tools import flatten_skill_content
    content = skill_info.get("content", "")
    if isinstance(content, dict):
        formatted_content = flatten_skill_content(content)
    elif isinstance(content, str):
        formatted_content = content
    else:
        formatted_content = str(content)
    
    new_skill_entry = {
        "name": skill_name_found,
        "description": skill_info.get("description", ""),
        "content": formatted_content
    }
    
    return Command(
        update={
            "loaded_skills": loaded_skills + [new_skill_entry]
        }
    )


list_mcps_schema = {
    "type": "object",
    "properties": {},
    "required": []
}

@tool(args_schema=list_mcps_schema)
def list_mcps(
    runtime: ToolRuntime | None = None, **kargs) -> str:
    """List all available MCP tool servers you can load. Each MCP provides a set of tools for a specific platform or service.

    Use this to discover what additional tool sets are available beyond your currently loaded tools.
    """
    available_mcps = runtime.state.get("available_mcps") or []
    loaded_mcps = runtime.state.get("loaded_mcps") or []
    loaded_mcp_names = [m.get("name") for m in loaded_mcps if isinstance(m, dict)]
    
    if not available_mcps:
        return "No additional MCP tool servers are available."
    
    lines = []
    for mcp in available_mcps:
        display_name = mcp.get("name", mcp.get("id", "unknown"))
        mcp_name = mcp.get("name", "")
        status = "LOADED" if mcp_name in loaded_mcp_names else "available"
        tool_names = mcp.get("tool_names", [])
        
        header = f"### **{display_name}** [{status}]"
        lines.append(header)
        
        description = mcp.get("description", "")
        if description:
            lines.append(f"  {description}")
        
        if tool_names:
            lines.append(f"  Tools: {', '.join(tool_names)}")
        
        lines.append("")
    
    result = "## Available MCP Tool Servers\n\n" + "\n".join(lines)
    worker_logger.info(f"[list_mcps] Returning {len(available_mcps)} MCPs")
    return result


load_mcp_schema = {
    "type": "object",
    "properties": {
        "mcp_id": {"type": "string"},
    },
    "required": ["mcp_id"]
}

@tool(args_schema=load_mcp_schema)
async def load_mcp(
    runtime: ToolRuntime | None = None, **kargs) -> Command:
    """Load an MCP tool server to make its tools available.

    After loading, the tools from this MCP will be available for use in subsequent steps.
    You can see available MCPs with the list_mcps tool.

    Args:
        mcp_id: The name of the MCP server to load (e.g., "discord", "uvian hub")
    """
    mcp_input = kargs["mcp_id"]
    loaded_mcps = runtime.state.get("loaded_mcps") or []
    available_mcps = runtime.state.get("available_mcps") or []
    loaded_mcp_names = [m.get("name") for m in loaded_mcps if isinstance(m, dict) and m.get("name")]
    
    mcp_info = next((m for m in available_mcps if m.get("name", "").lower() == mcp_input.lower()), None)
    if not mcp_info:
        mcp_info = next((m for m in available_mcps if m.get("id") == mcp_input), None)
    
    if not mcp_info:
        available_names = ", ".join(m.get("name", "unknown") for m in available_mcps)
        worker_logger.warning(f"[load_mcp] MCP not found: {mcp_input}")
        return Command(
            update={
                "messages": [ToolMessage(
                    f"MCP '{mcp_input}' not found. Available MCPs: {available_names}",
                    tool_call_id=runtime.tool_call_id,
                )]
            }
        )
    
    mcp_name = mcp_info.get("name", "")
    
    if mcp_name in loaded_mcp_names:
        worker_logger.info(f"[load_mcp] MCP already loaded: {mcp_name}")
        return Command(
            update={
                "messages": [ToolMessage(
                    f"MCP '{mcp_name}' is already loaded. Its tools are available.",
                    tool_call_id=runtime.tool_call_id,
                )]
            }
        )
    
    registry = runtime.config["configurable"].get("mcp_registry")
    if not registry:
        worker_logger.error(f"[load_mcp] No MCPRegistry in config")
        return Command(
            update={
                "messages": [ToolMessage(
                    f"Error: MCP registry not available.",
                    tool_call_id=runtime.tool_call_id,
                )]
            }
        )
    
    from clients.mcp import MCPRegistry
    tools = []
    if isinstance(registry, MCPRegistry):
        mcp_id = mcp_info.get("id")
        tools = await registry.get_tools_for_mcp(mcp_id)
        tool_names = [t.name for t in tools]
        tool_list = ", ".join(tool_names)
        worker_logger.info(f"[load_mcp] Loaded MCP '{mcp_name}' with {len(tools)} tools: {tool_list}")
        response_text = (
            f"SUCCESS: Loaded MCP '{mcp_name}' with {len(tools)} tools.\n"
            f"Tools now available: {tool_list}"
        )
    else:
        worker_logger.warning(f"[load_mcp] Registry is not an MCPRegistry instance")
        response_text = f"SUCCESS: Tools for MCP '{mcp_name}' are now available."
    
    new_mcp_entry = {
        "name": mcp_name,
        "description": mcp_info.get("description", ""),
        "tools": tools
    }
    
    return Command(
        update={
            "loaded_mcps": loaded_mcps + [new_mcp_entry]
        }
    )


tools = [load_skill, list_mcps, load_mcp]
