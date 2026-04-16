from langchain_community.chat_models.vertexai import ChatVertexAI
from typing import Any

from .rate_limiters import create_rate_limiter


def create(config: dict[str, Any]) -> ChatVertexAI:
    return ChatVertexAI(
        model=config.get("model_name", "gemini-2.0-flash"),
        temperature=config.get("temperature", 0.6),
        max_tokens=config.get("max_tokens"),
        google_api_key=config.get("api_key"),
        project=config.get("project"),
        location=config.get("location"),
        streaming=config.get("streaming", True),
        rate_limiter=create_rate_limiter(config.get("requests_per_second")),
    )