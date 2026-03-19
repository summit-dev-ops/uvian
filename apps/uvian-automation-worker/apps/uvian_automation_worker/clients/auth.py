import httpx
from core.config import UVIAN_AUTOMATION_API_URL, INTERNAL_API_KEY


async def get_agent_secrets(agent_user_id: str) -> dict:
    """Fetch all secrets for an agent from automation-api."""
    if not INTERNAL_API_KEY:
        raise ValueError("INTERNAL_API_KEY environment variable is required")

    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/secrets"
    headers = {"x-api-key": INTERNAL_API_KEY}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
