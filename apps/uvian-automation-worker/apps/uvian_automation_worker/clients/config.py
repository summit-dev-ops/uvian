import re
import httpx
from core.config import UVIAN_AUTOMATION_API_URL, UVIAN_INTERNAL_API_KEY


def _camel_to_snake(camel_str: str) -> str:
    """Convert camelCase to snake_case."""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def _normalize_keys(obj):
    """Recursively convert camelCase keys to snake_case."""
    if isinstance(obj, dict):
        return {_camel_to_snake(k): _normalize_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_normalize_keys(i) for i in obj]
    return obj


async def get_agent_skills(agent_user_id: str) -> list:
    """Fetch linked skills for an agent from automation-api."""
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/skills"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return _normalize_keys(data.get("skills", []))


async def get_agent_hooks(agent_user_id: str) -> list:
    """Fetch linked hooks for an agent from automation-api."""
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/hooks"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return _normalize_keys(data.get("hooks", []))


async def get_mcps_by_names(agent_user_id: str, mcp_names: list[str]) -> list:
    """Fetch MCPs by names for an agent from automation-api."""
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/mcps"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        all_mcps = _normalize_keys(data.get("mcps", []))
        
        return [mcp for mcp in all_mcps if mcp.get("name") in mcp_names]


async def get_skills_by_names(agent_user_id: str, skill_names: list[str]) -> list:
    """Fetch skills by names for an agent from automation-api."""
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/skills"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        all_skills = _normalize_keys(data.get("skills", []))
        
        return [skill for skill in all_skills if skill.get("name") in skill_names]


async def get_ticket(ticket_id: str) -> dict:
    """Fetch a ticket by ID from automation-api."""
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/tickets/{ticket_id}"
    headers = {"x-api-key": UVIAN_INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return _normalize_keys(response.json())


async def create_tool_approval_ticket(
    thread_id: str,
    tool_name: str,
    tool_call_id: str,
    reason: str | None = None,
) -> str:
    """Create a pending ticket for tool approval.

    Returns the ticket ID.
    """
    if not UVIAN_INTERNAL_API_KEY:
        raise ValueError("UVIAN_INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/tickets"
    headers = {
        "x-api-key": UVIAN_INTERNAL_API_KEY,
        "content-type": "application/json",
    }
    payload = {
        "title": f"Tool Approval: {tool_name}",
        "description": reason or f"Approval required to execute tool: {tool_name}",
        "status": "pending",
        "content": {
            "toolName": tool_name,
            "toolCallId": tool_call_id,
            "threadId": thread_id,
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data.get("ticket", {}).get("id") or data.get("id")