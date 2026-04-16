from langchain_openai import ChatOpenAI
from typing import Any

from .rate_limiters import create_rate_limiter


def create(config: dict[str, Any]) -> ChatOpenAI:
    llm_type = config.get("type", "openai")
    use_responses_api = llm_type == "openai_responses"

    return ChatOpenAI(
        model=config.get("model", config.get("model_name", "gpt-4o")),
        temperature=config.get("temperature", 0.6),
        max_tokens=config.get("max_tokens"),
        api_key=config.get("api_key"),
        base_url=config.get("base_url"),
        streaming=config.get("streaming", True),
        stream_usage=config.get("stream_usage", True),
        use_responses_api=use_responses_api,
        rate_limiter=create_rate_limiter(config.get("requests_per_second")),
    )