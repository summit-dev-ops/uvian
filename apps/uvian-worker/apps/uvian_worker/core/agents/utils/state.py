from langchain.messages import AnyMessage
from typing import TypedDict, List, Dict
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
    skills: List[Dict[str, str]] 
    conversation_id: str
    agent_profile_id: str
    message_id: str


class Skill(TypedDict):  
    """A skill that can be progressively disclosed to the agent."""
    name: str  # Unique identifier for the skill
    description: str  # 1-2 sentence description to show in system prompt
    content: str  # Full skill content with detailed instructions