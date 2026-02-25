from repositories.messages import message_repository
from core.agents.utils.templates import TRANSCRIPT_TEMPLATE
from langgraph.types import Command
from langchain.tools import tool, ToolRuntime
from core.events import events
import uuid

fetch_older_messages_schema = {
    "type": "object",
    "properties": {
        "conversation_id": {"type": "string"},
        "before_timestamp": {"type": "string"},
    },
    "required": ["conversation_id", "before_timestamp"]
}

@tool(args_schema=fetch_older_messages_schema)
async def fetch_older_messages(
    runtime: ToolRuntime | None = None, **kargs
) -> str:
    """
    Use this to fetch messages from a conversation history. You can use it to access other conversations and the one that you are currently working in.
    Provide the exact timestamp of the earliest message you currently see.
    """
    conversation_id = kargs["conversation_id"]
    before_timestamp = kargs["before_timestamp"]
    # 1. Fetch from DB
    db_messages = await message_repository.get_messages_with_profiles(
        conversation_id=conversation_id, 
        limit=20, 
        before_timestamp=before_timestamp
    )
    if not db_messages:
        return "<system_note>No older messages found.</system_note>"

    transcript = TRANSCRIPT_TEMPLATE.render(db_messages=db_messages)   
    # 2. Render and return as XML text
    return transcript

send_response_message_schema = {
    "type": "object",
    "properties": {
        "content": {"type": "string"},
    },
    "required": ["content"]
}

@tool(args_schema=send_response_message_schema)
async def send_response_message(
    runtime: ToolRuntime | None = None, **kargs
) -> Command:
    """
    Inserts a standard conversation message into the conversation as your response.

    """
    # is_init = False
    message_id = str(uuid.uuid4())
    # message_id: str = runtime.state.get("response_message_id")
    # if not message_id:
    #     is_init = True
    #     message_id = str(uuid.uuid4())

    new_content :str = kargs["content"]
    # is_final : bool = kargs.get("is_final", True)

    await events.publish_message(
        runtime.state.get("channel_id"), 
        runtime.state.get("conversation_id"), 
        runtime.state.get("agent_profile_id"), 
        message_id, 
        content=new_content, 
        is_delta= True, 
        is_complete=True
    )
        
    # if is_init:
    await message_repository.insert_message({
        "id": message_id,
        "sender_id": runtime.state.get("agent_profile_id"),
        "conversation_id": runtime.state.get("conversation_id"),
        "content": new_content,
        "role": "assistant"
    })
    # else:
    #     updated_message = await message_repository.update_message(
    #         message_id,
    #         {
    #             "content": new_content,
    #         }
    #     )
    #     new_content = updated_message.content

    return f"Message sent with {new_content}"

tools = [ fetch_older_messages]