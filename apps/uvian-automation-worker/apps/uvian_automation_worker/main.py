import asyncio
from core.config import REDIS_HOST, REDIS_FAMILY, REDIS_PORT, REDIS_PASSWORD, QUEUE_NAME, WORKER_CONCURRENCY
from repositories.jobs import job_repository, DatabaseError
from core.events import events
from bullmq import Worker
from core.dependency_injection import get_executor_factory, setup_default_executors
from core.logging import worker_logger
from executors.base import JobResult
from core.agents.event_transformers import EventTransformerRegistry

# Import all transformers to register them with the registry
import core.agents.event_transformers.message_transformer
import core.agents.event_transformers.ticket_transformer
import core.agents.event_transformers.content_transformer
import core.agents.event_transformers.space_transformer
import core.agents.event_transformers.job_transformer
import core.agents.event_transformers.discord_transformer
import core.agents.event_transformers.schedule_transformer

from core.logging import setup_worker_logging, LOG_LEVEL

setup_worker_logging(level=LOG_LEVEL)

# Event type prefixes that should be handled as agent events
EVENT_PREFIXES = [
    'com.uvian.message.',
    'com.uvian.conversation.',
    'com.uvian.ticket.',
    'com.uvian.post.',
    'com.uvian.note.',
    'com.uvian.asset.',
    'com.uvian.space.',
    'com.uvian.job.',
    'com.uvian.discord.',
    'com.uvian.schedule.',
]


def is_event_job(job_type: str) -> bool:
    """Check if job type is an event-based job."""
    return any(job_type.startswith(prefix) for prefix in EVENT_PREFIXES)


def transform_event_to_agent_message(job_record: dict) -> dict:
    """
    Transform event job data into agent format.
    Simply ensures the job type is set to 'agent' - message derivation happens in agent_executor.
    
    Args:
        job_record: The job record from the database
        
    Returns:
        Updated job_record ready for agent executor
    """
    job_type = job_record.get("type", "")
    input_data = job_record.get("input", {})
    event_type = input_data.get("eventType", job_type)
    
    worker_logger.info_job(job_record.get("id"), f"Preparing event job: {event_type}")
    
    # Just ensure type is 'agent' - the executor will derive the message from EventTransformerRegistry
    job_record["type"] = "agent"
    
    return job_record


# Initialize dependency injection container and executor factory
factory = get_executor_factory()
setup_default_executors()

worker_logger.info(f"Registered event transformers: {EventTransformerRegistry.list_registered()}")

async def process_job(job, token):
    """
    BullMQ Job Processor with dependency injection architecture.
    1. Reads jobId from queue.
    2. Fetches full job from Supabase.
    3. Resolves appropriate executor using dependency injection.
    4. Executes job through typed executor interface.
    5. Updates Supabase with result.
    """
    job_id: str = job.data.get("jobId")
    if not job_id:
        worker_logger.warning_job("Worker", "No jobId in payload. Using BullMQ job.id as fallback if mapped.")
        job_id = str(job.data.get("id", job.id))

    worker_logger.info_job(job_id, "Worker picked up job. Fetching from DB...")
    
    # 1. Fetch Job State
    try:
        job_record = job_repository.get_job(job_id)
    except DatabaseError as e:
        worker_logger.error_job(job_id, "Database connection failed", exception=e)
        return {"error": "Database unavailable"}

    if not job_record:
        worker_logger.error_job(job_id, "Job not found in DB. Aborting.")
        return {"error": "Job not found"}

    worker_logger.info_job(job_id, "Job found in DB. Updating status to processing...")
    
    # 2. Update Status -> Processing
    job_repository.update_job(job_id, {"status": "processing"})

    job_type: str = job_record.get("type", "unknown")
    worker_logger.info_job(job_id, f"Job type: {job_type}")
    
    # 2.5. Transform event jobs to agent format
    if is_event_job(job_type):
        worker_logger.info_job(job_id, f"Event job detected: {job_type}. Transforming to agent message...")
        job_record = transform_event_to_agent_message(job_record)
        job_type = "agent"
        worker_logger.info_job(job_id, f"Transformed to job type: {job_type}")
    
    # 2.6. Handle thread-wakeup jobs
    if job_type == "thread-wakeup":
        worker_logger.info_job(job_id, "Thread-wakeup job detected. Routing to agent executor...")
        job_type = "agent"
    
    # 3. Resolve executor using dependency injection
    try:
        executor = factory.get_executor(job_type)
    except ValueError as e:
        error_msg = f"No executor found for job type: {job_type}"
        worker_logger.error_job(job_id, error_msg, exception=e)
        job_repository.update_job(job_id, {"status": "failed", "output": {"error": error_msg}})

        # Return gracefully instead of crashing the worker
        worker_logger.info_job(job_id, "Worker continuing with next job...")
        return {"status": "failed", "error": error_msg, "job_type": job_type}

    # 4. Execute job through typed interface
    try:
        result: JobResult = await executor.execute(job_record)
        
        # 5. Update Status -> Completed
        job_repository.update_job(job_id, {"status": "completed", "output": result})
        worker_logger.info_job(job_id, "Job completed successfully.")
        return result

    except Exception as e:
        worker_logger.error_job(job_id, "Job execution failed", exception=e)

        # Update job status to failed
        try:
            job_repository.update_job(job_id, {"status": "failed", "output": {"error": str(e)}})
            worker_logger.info_job(job_id, "Job status updated to failed")
        except Exception as db_error:
            worker_logger.error_job(job_id, "Failed to update job status in database", exception=db_error)

        # Return gracefully instead of crashing
        worker_logger.info_job(job_id, "Worker continuing with next job...")
        return {"status": "failed", "error": str(e)}

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
