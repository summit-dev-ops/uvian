from langchain_openai import ChatOpenAI
from typing import Dict, Any
from core.config import HF_TOKEN
from langchain_core.rate_limiters import InMemoryRateLimiter

rate_limiter = InMemoryRateLimiter(requests_per_second=0.4)

def create_openai_model(config: Dict[str, Any]) -> ChatOpenAI:
     return ChatOpenAI(
        model="MiniMaxAI/MiniMax-M2.7:together",
        stream_usage=True,
        streaming=True,
        temperature=0.6,
        rate_limiter=rate_limiter,
        base_url="https://router.huggingface.co/v1",
        api_key=HF_TOKEN
    )
