from langchain.tools import tool, ToolRuntime
from langgraph.types import Command
from langchain_core.messages import ToolMessage, AIMessage
from core.logging import worker_logger

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
    # Skill not found
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
    
    # Find and return the requested skill
    for skill in skills:
        if skill["name"] == skill_name and not skill in loaded_skills:
            worker_logger.info(f"[load_skill] Loading skill: {skill_name}")
            return Command(
                update={
                    "loaded_skills": loaded_skills + [skill_name],  
                    "messages": [ToolMessage(f"Loaded skill: {skill_name}\n\n{skill['content']}", tool_call_id=runtime.tool_call_id)]
                }
            )
    
        
    # Skill not found
    available = ", ".join(s["name"] for s in skills)
    worker_logger.info(f"[load_skill] Skill not found: {skill_name}")
    return f"Skill '{skill_name}' not found. Available skills: {available}"


# Augment the LLM with tools
tools = [load_skill]