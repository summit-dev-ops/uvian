import asyncio
from core.config import REDIS_HOST, REDIS_FAMILY, REDIS_PORT, REDIS_PASSWORD, QUEUE_NAME, WORKER_CONCURRENCY
from repositories.jobs import job_repository, DatabaseError
from core.events import events
from bullmq import Worker
from core.dependency_injection import get_executor_factory, setup_default_executors
from core.logging import log
from executors.base import JobResult
from core.agents.event_transformers import EventTransformerRegistry

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
    
    log.info("preparing_event_job", job_id=job_record.get("id"), event_type=event_type)
    
    # Just ensure type is 'agent' - the executor will derive the message from EventTransformerRegistry
    job_record["type"] = "agent"
    
    return job_record


# Initialize dependency injection container and executor factory
factory = get_executor_factory()
setup_default_executors()

log.info("registered_event_transformers", transformers=EventTransformerRegistry.list_registered())

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
        log.warning("no_jobid_in_payload", job_id="Worker")
        job_id = str(job.data.get("id", job.id))

    log.info("job_picked_up", job_id=job_id)
    
    # 1. Fetch Job State
    try:
        job_record = job_repository.get_job(job_id)
    except DatabaseError as e:
        log.error("database_connection_failed", job_id=job_id, error=str(e))
        return {"error": "Database unavailable"}

    if not job_record:
        log.error("job_not_found", job_id=job_id)
        return {"error": "Job not found"}

    log.info("job_found_updating_status", job_id=job_id)
    
    # 2. Update Status -> Processing
    job_repository.update_job(job_id, {"status": "processing"})

    job_type: str = job_record.get("type", "unknown")
    log.info("job_type", job_id=job_id, job_type=job_type)
    
    # 2.5. Transform event jobs to agent format
    if is_event_job(job_type):
        log.info("event_job_detected", job_id=job_id, job_type=job_type)
        job_record = transform_event_to_agent_message(job_record)
        job_type = "agent"
        log.info("transformed_job_type", job_id=job_id, job_type=job_type)
    
    # 2.6. Handle thread-wakeup jobs
    if job_type == "thread-wakeup":
        log.info("thread_wakeup_detected", job_id=job_id)
        job_type = "agent"
    
    # 3. Resolve executor using dependency injection
    try:
        executor = factory.get_executor(job_type)
    except ValueError as e:
        error_msg = f"No executor found for job type: {job_type}"
        log.error(error_msg, job_id=job_id, error=str(e))
        job_repository.update_job(job_id, {"status": "failed", "output": {"error": error_msg}})

        # Return gracefully instead of crashing the worker
        log.info("continuing_after_executor_error", job_id=job_id)
        return {"status": "failed", "error": error_msg, "job_type": job_type}

    # 4. Execute job through typed interface
    try:
        result: JobResult = await executor.execute(job_record)
        
        # 5. Update Status -> Completed
        job_repository.update_job(job_id, {"status": "completed", "output": result})
        log.info("job_completed", job_id=job_id)
        return result

    except Exception as e:
        log.error("job_execution_failed", job_id=job_id, error=str(e))

        # Update job status to failed
        try:
            job_repository.update_job(job_id, {"status": "failed", "output": {"error": str(e)}})
            log.info("job_status_failed", job_id=job_id)
        except Exception as db_error:
            log.error("failed_update_job_status", job_id=job_id, error=str(db_error))

        # Return gracefully instead of crashing
        log.info("continuing_after_failure", job_id=job_id)
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
