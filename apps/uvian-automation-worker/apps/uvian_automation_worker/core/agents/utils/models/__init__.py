from typing import Any
from langchain_core.language_models.chat_models import BaseChatModel

from .openai import create as _create_openai
from .anthropic import create as _create_anthropic
from .google import create as _create_google
from .azure_openai import create as _create_azure_openai
from .minimax import create as _create_minimax


def create_llm(config: dict[str, Any]) -> BaseChatModel:
    llm_type = config.get("type", "openai")

    creators = {
        "openai": _create_openai,
        "openai_responses": _create_openai,
        "anthropic": _create_anthropic,
        "google": _create_google,
        "azure_openai": _create_azure_openai,
        "minimax": _create_minimax,
    }

    creator = creators.get(llm_type)
    if not creator:
        raise ValueError(f"Unsupported LLM type: {llm_type}. Available: {list(creators.keys())}")

    return creator(config)