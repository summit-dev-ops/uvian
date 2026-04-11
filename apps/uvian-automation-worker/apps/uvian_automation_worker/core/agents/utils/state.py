from langchain.messages import AnyMessage
from typing import TypedDict, List, Dict, Any
from typing_extensions import TypedDict, Annotated
import operator


class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
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
    agent_memory: Dict[str, Any]
    compaction_state: Dict[str, Any]


class Skill(TypedDict):
    """A skill that can be progressively disclosed to the agent."""
    name: str
    description: str
    content: str