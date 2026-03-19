from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any


def create_minimax_model(config: Dict[str, Any]) -> ChatOpenAI:
    return ChatOpenAI(
        model=config.get("model_name", "nemotron-3-super-free"),
        stream_usage=True,
        temperature=config.get("temperature", 0.6),
        base_url=config.get("base_url", "https://opencode.ai/zen/v1"),
        api_key=config.get("api_key"),
    )
