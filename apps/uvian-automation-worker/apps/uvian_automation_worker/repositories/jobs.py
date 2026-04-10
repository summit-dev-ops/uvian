from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.logging import log

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
                log.debug("job_found", job_id=job_id)
                return data[0]
            else:
                log.debug("job_not_found", job_id=job_id)
                return None

        except Exception as e:
            log.error("db_connection_error", job_id=job_id, error=str(e))
            raise DatabaseError(f"Failed to fetch job {job_id}: {e}")
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """Update a job with comprehensive error handling."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').update(updates).eq('id', job_id).execute()
            if result.data:
                log.debug("job_updated", job_id=job_id, updated_fields=list(updates.keys()))
                return True
            else:
                log.warning("job_update_no_data", job_id=job_id)
                return False
        except Exception as e:
            log.error("update_job_error", job_id=job_id, error=str(e))
            return False

    async def update_job_with_retry(self, job_id: str, updates: Dict[str, Any], max_retries: int = 3) -> bool:
        """Update job with retry logic for transient failures."""
        import asyncio

        for attempt in range(max_retries):
            try:
                return self.update_job(job_id, updates)
            except Exception as e:
                if attempt == max_retries - 1:
                    log.error("retry_final_failed", job_id=job_id, error=str(e))
                    return False
                log.warning("update_retry_failed", job_id=job_id, attempt=attempt + 1, error=str(e))
                await asyncio.sleep(2 ** attempt)
        return False
    
    def create_job(self, job_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new job."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').insert(job_data).execute()
            data = result.data
            log.info("created_job", job_id=job_data.get('id', 'new'))
            return data[0] if data else None
        except Exception as e:
            log.error("create_job_error", job_id="create_job", error=str(e))
            return None
    
    def get_jobs_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get all jobs with a specific status."""
        try:
            result = supabase_client.client.schema("core_automation").table('jobs').select('*').eq('status', status).execute()
            return result.data or []
        except Exception as e:
            log.error("get_jobs_by_status_error", job_id="get_jobs_by_status", status=status, error=str(e))
            return []

job_repository = JobRepository()
