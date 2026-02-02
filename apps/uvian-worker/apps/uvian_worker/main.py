import asyncio
import os
import signal
from bullmq import Worker
import json
from core.config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, QUEUE_NAME, WORKER_CONCURRENCY
from core.db import db
from core.events import events
from executors.chat_executor import ChatExecutor

# Registry of Executors
EXECUTORS = {
    "chat": ChatExecutor(),
    # "task": TaskExecutor()
}

async def process_job(job, token):
    """
    BullMQ Job Processor. 
    1. Reads jobId from queue.
    2. Fetches full job from Supabase (Mock).
    3. Dispatches to Executor.
    4. Updates Supabase with result.
    """
    job_id = job.data.get("jobId")
    if not job_id:
        # Fallback for old jobs or manual tests not following schema
        print(f"[Worker] Warning: No jobId in payload. Using BullMQ job.id as fallback if mapped.")
        job_id = str(job.data.get("id", job.id))

    print(f"[{job_id}] Worker picked up job. Fetching from DB...", flush=True)
    
    # 1. Fetch Job State
    job_record = db.get_job(job_id)
    if not job_record:
        print(f"[{job_id}] Job not found in DB. Aborting.", flush=True)
        return {"error": "Job not found"}

    print(f"[{job_id}] Job found in DB. Updating status to processing...", flush=True)  
    # 2. Update Status -> Processing/
    print(job_record, flush= True)
    # Update job status to processing
    db.update_job(job_id, {"status": "processing"})

    job_type = job_record.get("type", "unknown")
    print(f"[{job_id}] Job type: {job_type}", flush=True)
    executor = EXECUTORS.get(job_type)

    if not executor:
        error_msg = f"No executor found for type: {job_type}"
        print(f"[{job_id}] {error_msg}", flush=True )
        db.update_job(job_id, {"status": "failed", "output": {"error": error_msg}})
        raise ValueError(error_msg)

    # 3. Execute
    try:
        result = await executor.execute(job_record)
        
        # 4. Update Status -> Completed
        db.update_job(job_id, {"status": "completed", "output": result})
        print(f"[{job_id}] Job completed successfully." , flush=True)
        return result

    except Exception as e:
        print(f"[{job_id}] Job failed: {e}", flush=True)
        db.update_job(job_id, {"status": "failed", "output": {"error": str(e)}})
        raise e

async def main():
    # Connect to Redis for Pub/Sub events
    await events.connect()

    # Redis Options for BullMQ
    bull_redis_opts = {
        "host": REDIS_HOST, 
        "port": REDIS_PORT, 
        "password": REDIS_PASSWORD,
        "db": 0
    }

    print(f"Starting Worker on queue '{QUEUE_NAME}' with concurrency {WORKER_CONCURRENCY}...", flush=True)
    
    worker = Worker(
        QUEUE_NAME,
        process_job,
        {
            "connection": bull_redis_opts, 
            "concurrency": WORKER_CONCURRENCY,
            "prefix": "bull" # Standard prefix
        },
    )

    # Graceful Shutdown
    stop_event = asyncio.Event()

    def handle_signal():
        stop_event.set()

    loop = asyncio.get_running_loop()
    # Windows doesn't fully support add_signal_handler for SIGINT in the same way, 
    # but basic KeyboardInterrupt handling in run() usually works.
    # For robustness in containers:
    # loop.add_signal_handler(signal.SIGINT, handle_signal)
    # loop.add_signal_handler(signal.SIGTERM, handle_signal)

    try:
        await stop_event.wait()
    except asyncio.CancelledError:
        pass
    finally:
        print("Shutting down worker...")
        await worker.close()
        await events.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
