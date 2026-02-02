from executors.base import BaseExecutor
from clients.runpod import chat_completion
from core.events import events
from core.db import db

class ChatExecutor(BaseExecutor):
    async def execute(self, job_data: dict):
        job_id = job_data["id"]
        inputs = job_data.get("input", {})
        print(f"[{job_id}] Inputs: {inputs}", flush=True)   
        conversation_id = inputs.get("conversationId")
        # Ensure we have a conversation ID for streaming
        if conversation_id:
            channel = f"conversation:{conversation_id}:messages"
        else:
            # Fallback channel or log warning
            channel = f"job:{job_id}:responses"

        messages = inputs.get("messages", [])
        system_prompt = inputs.get("systemPrompt")
        
        # Prepend system prompt if provided and not present
        if system_prompt:
             # Check if first message is system, if so replace, else prepend
             if messages and messages[0].get("role") == "system":
                 messages[0]["content"] = system_prompt
             else:
                 messages.insert(0, {"role": "system", "content": system_prompt})

        full_response = []
        
        try:
            print(f"[{job_id}] Starting Chat Execution on channel {channel}...")
            async for token in chat_completion(messages):
                await events.publish_token(channel, job_id, token)
                full_response.append(token)
            
            await events.publish_token(channel, job_id, "", finished=True)
            
            result_text = "".join(full_response)
            return {"text": result_text}

        except Exception as e:
            print(f"[{job_id}] Chat Execution Failed: {e}")
            await events.publish_token(channel, job_id, "", finished=True, error=str(e))
            raise e
