from langchain_openai import ChatOpenAI
from typing import Dict, Any


# def create_runpod_model(config: Dict[str, Any]) -> ChatOpenAI:
#     return ChatOpenAI(
#         model=config.get("model_name", "NousResearch/Hermes-4-70B-FP8"),
#         stream_usage=True,
#         temperature=config.get("temperature", 0.6),
#         base_url=config.get("base_url", "https://opencode.ai/zen/v1/chat/completions"),
#         api_key=config.get("api_key", "sk-cBaoEPGlWz0F39wZ44jJj2C2lxgyAQhDdQdj7yHqE4ZI3w3LDufUMzKBUgN5ybT8"),
#     )

def create_runpod_model(config: Dict[str, Any]) -> ChatOpenAI:
     return ChatOpenAI(
        model="qwen3.6-plus-free",
        stream_usage=True,
        temperature=0.6,
        base_url="https://opencode.ai/zen/v1/",
        api_key="sk-jhuUiZevarfMPxfZKoft8aF0xWq8hjm4vdfVrnfIdgpE39TivVOZCcwvSvJxNR9z",
    )
