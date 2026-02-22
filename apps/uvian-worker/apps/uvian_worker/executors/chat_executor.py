from typing import List, Dict, Any
import uuid
from executors.base import BaseExecutor, JobData, JobResult
from core.events import events
from clients.runpod import chat_completion
from repositories.messages import message_repository
from repositories.conversations import conversation_repository
from executors.config import SYSTEM_MESSAGE

class ChatExecutor(BaseExecutor):
    """Chat executor for conversation-based AI interactions."""
    
    async def execute(self, job_data: JobData) -> JobResult:
        """Execute a chat job with comprehensive type safety."""
        job_id: str = job_data["id"]
        inputs: Dict[str, Any] = job_data.get("input", {})
        
        sender_id = inputs.get("agentProfileId")
        if not sender_id:
            raise ValueError("agentProfileId is required in job input")

        # Fetch minimal parameters from job input
        conversation_id = inputs.get("conversationId")
        if not conversation_id:
            raise ValueError("conversationId is required in job input")
        
        # Fetch conversation from database
        conversation = conversation_repository.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Fetch messages from database for this conversation
        messages: List[Dict[str, Any]] = message_repository.get_messages(conversation_id)
        
        # Set up streaming channel
        channel: str = f"conversation:{conversation_id}:messages"
        
        full_response: List[str] = []
        
        message_id: str = str(uuid.uuid4())

        try:
            # Prepare messages for AI (convert to expected format)
            ai_messages: List[Dict[str, str]] = [SYSTEM_MESSAGE]
            
            # Add existing conversation messages
            for msg in messages:
                ai_messages.append({
                    "role": str(msg["role"]) if msg["role"] is not None else "user",
                    "content": str(msg["content"]) if msg["content"] is not None else ""
                })
            
            async for token in chat_completion(ai_messages):
                await events.publish_message(
                    channel, 
                    conversation_id, 
                    sender_id,
                    message_id,
                    content=token, 
                    is_delta=True
                ) 
                full_response.append(token)
            
            result_text: str = "".join(full_response)
            
            # Send final completion message
            await events.publish_message(
                channel, 
                conversation_id, 
                sender_id,
                message_id,
                content=result_text, 
                is_delta=False, 
                is_complete=True
            )
            
            message_repository.insert_message({
                "id": message_id,
                "sender_id": sender_id,
                "conversation_id": conversation_id,
                "content": result_text,
                "role": "assistant"
            })
            
            return {
                "status": "completed",
                "result": {
                    "text": result_text, 
                    "conversationId": conversation_id, 
                    "messageId": message_id
                }
            }

        except Exception as e:
            await events.publish_token(channel, job_id, "", finished=True, error=str(e))
            return {
                "status": "failed",
                "result": {"error": str(e)}
            }
