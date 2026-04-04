import httpx
from core.config import UVIAN_AUTOMATION_API_URL, UVIAN_INTERNAL_API_KEY


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
        return data.get("skills", [])
