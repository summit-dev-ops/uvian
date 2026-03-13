import httpx
from core.config import (
    UVIAN_API_URL,
    UVIAN_AUTOMATION_API_URL,
    INTERNAL_API_KEY
)


async def get_agent_api_key(agent_user_id: str) -> str:
    """Get the decrypted API key from automation-api."""
    if not INTERNAL_API_KEY:
        raise ValueError("INTERNAL_API_KEY environment variable is required")
    
    url = f"{UVIAN_AUTOMATION_API_URL}/api/agents/{agent_user_id}/api-key"
    headers = {"x-internal-api-key": INTERNAL_API_KEY}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["api_key"]


async def exchange_for_jwt(api_key: str) -> str:
    """Exchange API key for JWT token at uvian-api."""
    url = f"{UVIAN_API_URL}/api/auth/get-jwt"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json={"api_key": api_key})
        response.raise_for_status()
        data = response.json()
        return data["jwt"]
