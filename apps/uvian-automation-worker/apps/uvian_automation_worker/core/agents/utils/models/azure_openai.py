from langchain_community.chat_models.azure_openai import AzureChatOpenAI
from typing import Any

from .rate_limiters import create_rate_limiter


def create(config: dict[str, Any]) -> AzureChatOpenAI:
    return AzureChatOpenAI(
        model=config.get("model_name"),
        temperature=config.get("temperature", 0.6),
        max_tokens=config.get("max_tokens"),
        api_key=config.get("api_key"),
        azure_endpoint=config.get("base_url"),
        api_version=config.get("api_version", "2024-02-01"),
        deployment_name=config.get("deployment_name"),
        streaming=config.get("streaming", True),
        rate_limiter=create_rate_limiter(config.get("requests_per_second")),
    )