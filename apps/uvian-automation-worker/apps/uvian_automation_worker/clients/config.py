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