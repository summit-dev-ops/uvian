from langchain_community.chat_models.anthropic import ChatAnthropic
from typing import Any

from .rate_limiters import create_rate_limiter


def create(config: dict[str, Any]) -> ChatAnthropic:
    return ChatAnthropic(
        model=config.get("model_name", "claude-3-5-sonnet-20241022"),
        temperature=config.get("temperature", 0.6),
        max_tokens=config.get("max_tokens"),
        max_retries=config.get("max_retries", 2),
        anthropic_api_key=config.get("api_key"),
        base_url=config.get("base_url"),
        streaming=config.get("streaming", True),
        rate_limiter=create_rate_limiter(config.get("requests_per_second")),
    )