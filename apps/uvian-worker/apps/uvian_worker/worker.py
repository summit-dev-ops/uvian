import asyncio
import os
import json
import io
import sys
import redis.asyncio as redis # Use async redis
from bullmq import Worker

# Import our async wrapper functions
from runpod_client import chat_completion, text_completion, embedding

# Global Redis connection
r: redis.Redis = None

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

async def process_job(job, token):
    """
    BullMQ Job Processor
    """
    print(f"[{job.id}] Started processing...", flush=True)
    
    data = job.data or {}
    job_type = data.get("type", "completion")
    model = data.get("model")
    options = data.get("options", {})

    # Select the generator
    if job_type == "chat":
        prompt = data.get("messages") or data.get("prompt")
        gen = chat_completion(prompt, model=model, **options)
    elif job_type == "embedding":
        # Note: Embedding usually just yields one result
        prompt = data.get("prompt", "")
        gen = embedding(prompt, model=model, **options)
    else:
        prompt = data.get("prompt", "")
        gen = text_completion(prompt, model=model, **options)

    response_channel = f"conversation:hi:messages"

    try:
        # Iterate over the async generator (which pulls from the thread queue)
        async for part in gen:
            # Publish token to Redis
            await r.publish(
                response_channel,
                json.dumps({"job_id": job.id, "token": part, "finished": False}),
            )
        
        # Signal finished
        await r.publish(
            response_channel,
            json.dumps({"job_id": job.id, "token": "", "finished": True}),
        )
        print(f"[{job.id}] Finished successfully.", flush=True)
        
        return {"status": "success"}

    except Exception as exc:
        print(f"[{job.id}] Failed: {exc}", flush=True)
        if r:
            await r.publish(
                response_channel,
                json.dumps({"job_id": job.id, "error": str(exc), "finished": True}),
            )
        raise exc

async def main():
    global r
    
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    redis_password = os.getenv("REDIS_PASSWORD", None)

    # 1. Initialize Async Redis (for Publishing responses)
    r = redis.Redis(
        host=redis_host, 
        port=redis_port, 
        password=redis_password,
        decode_responses=True
    )

    # 2. BullMQ Connection Settings
    bull_redis_opts = {
        "host": redis_host, 
        "port": redis_port, 
        "password": redis_password,
        "db": 0
    }

    # 3. Initialize Worker
    # CRITICAL: Set 'concurrency'. 
    # This allows the worker to process e.g. 50 streams effectively in parallel 
    # because they are mostly waiting on the network/queue.
    worker = Worker(
        "main-queue",
        process_job,
        {
            "connection": bull_redis_opts, 
            "concurrency": 50, 
            "prefix": "bull"
        },
    )

    print("Worker started. Waiting for jobs...", flush=True)

    # 4. Keep running until cancelled
    # Create a shutdown event
    stop_event = asyncio.Event()
    
    # In a real app, handle SIGINT/SIGTERM to set stop_event
    try:
        await stop_event.wait()
    except asyncio.CancelledError:
        await worker.close()
        await r.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass