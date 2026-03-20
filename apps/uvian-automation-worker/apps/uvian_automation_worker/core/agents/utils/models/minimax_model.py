from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any


def create_minimax_model(config: Dict[str, Any]) -> ChatOpenAI:
    return ChatOpenAI(
        model="nemotron-3-super-free",
        stream_usage=True,
        temperature=0.6,
        base_url="https://opencode.ai/zen/v1/",
        api_key="sk-cBaoEPGlWz0F39wZ44jJj2C2lxgyAQhDdQdj7yHqE4ZI3w3LDufUMzKBUgN5ybT8",
    )
