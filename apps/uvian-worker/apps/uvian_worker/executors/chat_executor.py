from executors.base import BaseExecutor
from core.events import events
from clients.runpod import chat_completion
from repositories.messages import message_repository
from repositories.conversations import conversation_repository

class ChatExecutor(BaseExecutor):
    async def execute(self, job_data: dict):
        job_id = job_data["id"]
        inputs = job_data.get("input", {})
        print(f"[{job_id}] Job inputs (minimal parameters): {inputs}", flush=True)   
        
        # Fetch minimal parameters from job input
        conversation_id = inputs.get("conversationId")
        message_id = inputs.get("messageId")
        
        if not conversation_id:
            raise ValueError("conversationId is required in job input")
        
        # Fetch conversation from database
        conversation = conversation_repository.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Fetch messages from database for this conversation
        messages = message_repository.get_messages(conversation_id)
        
        # Set up streaming channel
        channel = f"conversation:{conversation_id}:messages"
        
        # Optional system prompt from job input
        system_prompt = inputs.get("systemPrompt")
        
        full_response = []
        
        try:
            print(f"[{job_id}] Fetched conversation '{conversation['title']}' with {len(messages)} messages", flush=True)
            print(f"[{job_id}] Starting Chat Execution on channel {channel}...", flush=True)
            
            # Prepare messages for AI (convert to expected format)
            ai_messages = []
            
            # Add system prompt if provided
            if system_prompt:
                ai_messages.append({"role": "system", "content": system_prompt})
            
            # Add existing conversation messages
            for msg in messages:
                ai_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            async for token in chat_completion(ai_messages):
                # Use messageId from job input, fallback to job_id
                msg_id = message_id or f"msg_{job_id}"
                await events.publish_message(
                    channel, 
                    conversation_id, 
                    message_id=msg_id, 
                    content=token, 
                    is_delta=True
                )
                full_response.append(token)
            
            result_text = "".join(full_response)
            
            # Send final completion message
            msg_id = message_id or f"msg_{job_id}"
            await events.publish_message(
                channel, 
                conversation_id, 
                message_id=msg_id, 
                content=result_text, 
                is_delta=False, 
                is_complete=True
            )
            
            # Insert the final assistant message into the database
            import uuid
            new_message_id = msg_id
            message_repository.insert_message({
                "id": new_message_id,
                "conversation_id": conversation_id,
                "content": result_text,
                "role": "assistant"
            })
            
            return {"text": result_text, "conversationId": conversation_id}

        except Exception as e:
            print(f"[{job_id}] Chat Execution Failed: {e}")
            await events.publish_token(channel, job_id, "", finished=True, error=str(e))
            raise e
