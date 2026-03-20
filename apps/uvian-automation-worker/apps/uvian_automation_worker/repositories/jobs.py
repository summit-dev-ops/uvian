from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.logging import worker_logger

class DatabaseError(Exception):
    """Custom exception for database operations."""
    pass

class JobRepository:
    """Repository for job-related database operations with comprehensive type safety."""
    
    def get_job(self, job_id: str):
        """
        Fetch a job by ID with proper error handling.

        Returns:
            - Dict: Job data if found
            - None: Job not found (404 equivalent)
            - Raises DatabaseError: For connection/query errors
        """
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').select('*').eq('id', job_id).execute()
            data = result.data
            if data:
                worker_logger.debug_job(job_id, "Job found in database")
                return data[0]
            else:
                worker_logger.debug_job(job_id, "Job not found in database")
                return None

        except Exception as e:
            worker_logger.error_job(job_id, f"Database connection/query error", exception=e)
            raise DatabaseError(f"Failed to fetch job {job_id}: {e}")
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """Update a job with comprehensive error handling."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').update(updates).eq('id', job_id).execute()
            if result.data:
                worker_logger.debug_job(job_id, f"Updated job in database: {list(updates.keys())}")
                return True
            else:
                worker_logger.warning_job(job_id, "Job update returned no data")
                return False
        except Exception as e:
            worker_logger.error_job(job_id, f"Error updating job in database", exception=e)
            return False

    async def update_job_with_retry(self, job_id: str, updates: Dict[str, Any], max_retries: int = 3) -> bool:
        """Update job with retry logic for transient failures."""
        import asyncio

        for attempt in range(max_retries):
            try:
                return self.update_job(job_id, updates)
            except Exception as e:
                if attempt == max_retries - 1:
                    worker_logger.error_job(job_id, f"Final retry failed for job update", exception=e)
                    return False
                worker_logger.warning_job(job_id, f"Update attempt {attempt + 1} failed, retrying...", exception=e)
                await asyncio.sleep(2 ** attempt)
        return False
    
    def create_job(self, job_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new job."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').insert(job_data).execute()
            data = result.data
            worker_logger.info_job(job_data.get('id', 'new'), f"Created new job in database")
            return data[0] if data else None
        except Exception as e:
            worker_logger.error_job("create_job", f"Error creating job in database", exception=e)
            return None
    
    def get_jobs_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get all jobs with a specific status."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').select('*').eq('status', status).execute()
            return result.data or []
        except Exception as e:
            worker_logger.error_job("get_jobs_by_status", f"Error fetching jobs with status {status}", exception=e)
            return []

job_repository = JobRepository()
