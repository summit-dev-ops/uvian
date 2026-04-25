from langchain.messages import AnyMessage
from typing import TypedDict, List, Dict, Any
from typing_extensions import TypedDict, Annotated
import operator

from core.agents.utils.types.mcp import LoadedMCP, AvailableMCP


class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
    agent_name: str
    transcript: str
    response_message_id: str
    custom_instructions: str
    channel_id: str
    loaded_skills: Annotated[List[Dict[str, Any]], operator.add]
    loaded_mcps: Annotated[List[LoadedMCP], operator.add]
    available_skills: List[Dict[str, str]]
    available_mcps: List[AvailableMCP]
    conversation_id: str
    agent_profile_id: str
    message_id: str
    event_metadata: Dict[str, Any]
    thread_id: str
    agent_user_id: str
    execution_id: str
    inbox_messages_added: int
    agent_memory: Dict[str, Any]
    compaction_state: Dict[str, Any]
    session_context_size: int
    tokens_used: int
    pending_tool_approval: Dict[str, Any] | None
    expected_tool_calls: List[Dict[str, Any]]
    connected_mcps: List[str]


class Skill(TypedDict):
    """A skill that can be progressively disclosed to the agent."""
    name: str
    description: str
    content: str