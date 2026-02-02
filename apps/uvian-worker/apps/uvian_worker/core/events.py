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
        Publishes a token or finish signal to the specified channel.
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

events = EventsClient()
