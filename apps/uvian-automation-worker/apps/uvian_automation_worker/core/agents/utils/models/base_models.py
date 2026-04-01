from langchain_openai import ChatOpenAI
from typing import Dict, Any
from langchain_core.rate_limiters import InMemoryRateLimiter

rate_limiter = InMemoryRateLimiter(requests_per_second=0.4)

def create_openai_model(config: Dict[str, Any]) -> ChatOpenAI:
     return ChatOpenAI(
        model="qwen3.6-plus-free",
        stream_usage=True,
        streaming=True,
        temperature=0.6,
        rate_limiter=rate_limiter,
        base_url="https://opencode.ai/zen/v1/",
        api_key="sk-cBaoEPGlWz0F39wZ44jJj2C2lxgyAQhDdQdj7yHqE4ZI3w3LDufUMzKBUgN5ybT8",
    )
