from langchain_openai import ChatOpenAI
from typing import Dict, Any


def create_runpod_model(config: Dict[str, Any]) -> ChatOpenAI:
    return ChatOpenAI(
        model=config.get("model_name", "NousResearch/Hermes-4-70B-FP8"),
        stream_usage=True,
        temperature=config.get("temperature", 0.6),
        base_url=config.get("base_url", f"https://api.runpod.ai/v2/{config.get('endpoint_id')}/openai/v1"),
        api_key=config.get("api_key", "sk-cBaoEPGlWz0F39wZ44jJj2C2lxgyAQhDdQdj7yHqE4ZI3w3LDufUMzKBUgN5ybT8"),
    )
