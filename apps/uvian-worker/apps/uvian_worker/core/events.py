import redis.asyncio as redis
from core.config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
import json

class EventsClient:
    def __init__(self):
        self.redis = None

    async def connect(self):
        self.redis = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            decode_responses=True
        )

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def publish_token(self, channel: str, job_id: str, token: str, finished: bool = False, error: str = None):
        """
        Publishes a token or finish signal to the specified channel. (Legacy)
        """
        if not self.redis:
            await self.connect()
        
        payload = {
            "job_id": job_id, 
            "token": token, 
            "finished": finished
        }
        if error:
            payload["error"] = error
            
        await self.redis.publish(channel, json.dumps(payload))

    async def publish_message(self, channel: str, conversation_id: str, sender_id:str, message_id: str, content: str, role: str = "assistant", is_delta: bool = False, is_complete: bool = False):
        """
        Publishes a message or delta to the specified channel using the new new_message format.
        """
        if not self.redis:
            await self.connect()

        now = "2026-02-03T10:35:56Z" # Fallback or dynamic if possible, but let's keep it simple for now as the API might override it
        
        payload = {
            "message": {
                "id": message_id,
                "conversationId": conversation_id,
                "senderId": sender_id,
                "content": content,
                "role": role,
                "createdAt": now,
                "updatedAt": now
            },
            "isDelta": is_delta,
            "isComplete": is_complete
        }
        
        await self.redis.publish(channel, json.dumps(payload))

events = EventsClient()
