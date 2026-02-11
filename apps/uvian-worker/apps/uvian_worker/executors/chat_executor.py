from executors.base import BaseExecutor
from core.events import events
from clients.runpod import chat_completion
from repositories.messages import message_repository
from repositories.conversations import conversation_repository
import uuid

class ChatExecutor(BaseExecutor):
    async def execute(self, job_data: dict):
        job_id = job_data["id"]
        inputs = job_data.get("input", {})
        print(f"[{job_id}] Job inputs (minimal parameters): {inputs}", flush=True)   
        
        # Fetch minimal parameters from job input
        conversation_id = inputs.get("conversationId")
        sender_id = inputs.get("agentProfileId")

        if not conversation_id:
            raise ValueError("conversationId is required in job input")
        
        # Fetch conversation from database
        conversation = conversation_repository.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        sender_id = inputs.get("agentProfileId")
        if not sender_id:
            raise ValueError("agentProfileId is required in job input")

        # Fetch messages from database for this conversation
        messages = message_repository.get_messages(conversation_id)
        
        # Set up streaming channel
        channel = f"conversation:{conversation_id}:messages"
        
        full_response = []
        
        message_id = str(uuid.uuid7())

        try:
            print(f"[{job_id}] Fetched conversation '{conversation['title']}' with {len(messages)} messages", flush=True)
            print(f"[{job_id}] Starting Chat Execution on channel {channel}...", flush=True)
            
            # Prepare messages for AI (convert to expected format)
            ai_messages = []
            
            # Add existing conversation messages
            for msg in messages:
                ai_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
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
            
            result_text = "".join(full_response)
            
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
                "sender_id" : sender_id,
                "conversation_id": conversation_id,
                "content": result_text,
                "role": "assistant"
            })
            
            return {"text": result_text, "conversationId": conversation_id, "messageId": message_id}

        except Exception as e:
            print(f"[{job_id}] Chat Execution Failed: {e}")
            await events.publish_token(channel, job_id, "", finished=True, error=str(e))
            raise e
