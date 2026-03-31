from langchain_openai import ChatOpenAI
from typing import Optional, Dict, Any


def create_minimax_model(config: Dict[str, Any]) -> ChatOpenAI:
    return ChatOpenAI(
        model="qwen3.6-plus-free",
        stream_usage=True,
        temperature=0.6,
        base_url="https://opencode.ai/zen/v1/",
        api_key="sk-jhuUiZevarfMPxfZKoft8aF0xWq8hjm4vdfVrnfIdgpE39TivVOZCcwvSvJxNR9z",
    )
