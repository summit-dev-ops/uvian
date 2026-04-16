from langchain_community.chat_models.minimax import MiniMaxChat
from typing import Any

from .rate_limiters import create_rate_limiter


def create(config: dict[str, Any]) -> MiniMaxChat:
    return MiniMaxChat(
        model=config.get("model_name"),
        temperature=config.get("temperature", 0.6),
        max_tokens=config.get("max_tokens"),
        api_key=config.get("api_key"),
        base_url=config.get("base_url"),
        streaming=config.get("streaming", True),
        rate_limiter=create_rate_limiter(config.get("requests_per_second")),
    )