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
    runtime: ToolRuntime | None = None, **kargs) -> str:
    """Load the full content of a skill into the agent's context.

    Use this when you need detailed information about how to handle a specific
    type of request. This will provide you with comprehensive instructions,
    policies, and guidelines for the skill area.

    Args:
        skill_name: The name of the skill to load (e.g., "expense_reporting", "travel_booking")
    """
    loaded_skills = runtime.state.get("loaded_skills") or []
    skills = runtime.state.get("skills")
    skill_name = kargs["skill_name"]
    worker_logger.info(f"[load_skill] Called with skill_name: {skill_name}, loaded: {loaded_skills}")
    
    for skill in skills:
        if skill["name"] == skill_name and skill_name not in loaded_skills:
            worker_logger.info(f"[load_skill] Loading skill: {skill_name}")
            content = skill.get("content", {})
            if isinstance(content, dict):
                formatted_content = flatten_skill_content(content)
            elif isinstance(content, str):
                formatted_content = content
            else:
                formatted_content = str(content)
            return Command(
                update={
                    "loaded_skills": loaded_skills + [skill_name],  
                    "messages": [ToolMessage(f"Loaded skill: {skill_name}\n\n{formatted_content}", tool_call_id=runtime.tool_call_id)]
                }
            )
        
    available = ", ".join(s["name"] for s in skills)
    worker_logger.info(f"[load_skill] Skill not found: {skill_name}")
    return f"Skill '{skill_name}' not found. Available skills: {available}"


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
    
    if not available_mcps:
        return "No additional MCP tool servers are available."
    
    lines = []
    for mcp in available_mcps:
        display_name = mcp.get("name", mcp["id"])
        status = "LOADED" if mcp["id"] in loaded_mcps else "available"
        usage = mcp.get("usage_guidance", "")
        tool_descriptions = mcp.get("tool_descriptions", [])
        
        header = f"### **{display_name}** [{status}]"
        lines.append(header)
        
        if usage:
            lines.append(f"  Use for: {usage}")
        
        if tool_descriptions:
            lines.append(f"  Tools ({len(tool_descriptions)}):")
            for td in tool_descriptions:
                lines.append(f"    - {td}")
        else:
            tool_count = mcp.get("tool_count", 0)
            if tool_count > 0:
                lines.append(f"  Tools: {tool_count} available (load this MCP to see details)")
        
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
    
    mcp_info = next((m for m in available_mcps if m.get("name", "").lower() == mcp_input.lower()), None)
    if not mcp_info:
        mcp_info = next((m for m in available_mcps if m["id"] == mcp_input), None)
    
    if not mcp_info:
        available_names = ", ".join(m.get("name", m["id"]) for m in available_mcps)
        worker_logger.warning(f"[load_mcp] MCP not found: {mcp_input}")
        return Command(
            update={
                "messages": [ToolMessage(
                    f"MCP '{mcp_input}' not found. Available MCPs: {available_names}",
                    tool_call_id=runtime.tool_call_id,
                )]
            }
        )
    
    mcp_key = mcp_info["id"]
    mcp_name = mcp_info.get("name", mcp_key)
    
    if mcp_key in loaded_mcps:
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
    if isinstance(registry, MCPRegistry):
        tools = await registry.get_tools_for_mcp(mcp_key)
        tool_names = [t.name for t in tools]
        tool_list = ", ".join(tool_names)
        worker_logger.info(f"[load_mcp] Loaded MCP '{mcp_name}' ({mcp_key}) with {len(tools)} tools: {tool_list}")
        response_text = (
            f"SUCCESS: Loaded MCP '{mcp_name}' with {len(tools)} tools.\n"
            f"Tools now available: {tool_list}"
        )
    else:
        worker_logger.warning(f"[load_mcp] Registry is not an MCPRegistry instance")
        response_text = f"SUCCESS: Tools for MCP '{mcp_name}' are now available."
    
    return Command(
        update={
            "loaded_mcps": loaded_mcps + [mcp_key],
            "messages": [ToolMessage(response_text, tool_call_id=runtime.tool_call_id)]
        }
    )


tools = [load_skill, list_mcps, load_mcp]
