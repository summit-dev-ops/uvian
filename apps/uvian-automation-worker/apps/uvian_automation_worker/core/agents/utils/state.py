from langchain.messages import AnyMessage
from typing import TypedDict, List, Dict, Any
from typing_extensions import TypedDict, Annotated
from langchain_core.tools import BaseTool

MESSAGES_REPLACE = "__REPLACE_MESSAGES__"

def messages_reducer(
    existing: list[AnyMessage],
    updates: list[AnyMessage]
) -> list[AnyMessage]:
    if not updates:
        return existing
    first_content = updates[0].content if hasattr(updates[0], 'content') else str(updates[0])
    if first_content == MESSAGES_REPLACE:
        return updates[1:] if len(updates) > 1 else []
    return existing + updates

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], messages_reducer]
    llm_calls: int
    agent_name: str
    transcript: str
    response_message_id: str
    custom_instructions: str
    channel_id: str
    available_skills: List[Dict[str, str]]
    loaded_skills: List[Dict[str, Any]]
    available_mcps: List[Dict[str, str]]
    loaded_mcps: List[Dict[str, Any]]
    conversation_id: str
    agent_profile_id: str
    message_id: str
    event_metadata: Dict[str, Any]
    thread_id: str
    inbox_messages_added: int
    conversation_summary: str
    agent_memory: Dict[str, Any]  # Synced from remote at startup + after tools


class Skill(TypedDict):
    """A skill that can be progressively disclosed to the agent."""
    name: str
    description: str
    content: str