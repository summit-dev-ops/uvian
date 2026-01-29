import asyncio
import os
from bullmq import Worker

async def process_job(job, token):
    print(f"Processing job {job.id}...", flush=True)
    print(f"Job Data: {job.data}", flush=True)
    
    # Simulate work
    await asyncio.sleep(1)
    
    print(f"Finished job {job.id}", flush=True)
    return {"status": "success", "result": "Job completed by Python worker"}

async def main():
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    
    redis_options = {
        "host": redis_host,
        "port": redis_port,
    }

    print(f"Connecting to Redis at {redis_host}:{redis_port}...", flush=True)
    
    worker = Worker(
        "main-queue",
        process_job,
        {
            "connection": redis_options,
            "prefix": "bull" # Explicitly set default prefix
        }
    )

    print("Worker instance created.", flush=True)
    
    # Check if worker is actually connected or has issues
    # Note: bullmq-python might not have an easy 'isConnected' but we can check the redis client if exposed
    # For now, just wait and see if it picks up.
    
    print("Worker started. Waiting for jobs in 'main-queue'...", flush=True)
    
    # Keep the worker running
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        await worker.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Worker stopped.", flush=True)
