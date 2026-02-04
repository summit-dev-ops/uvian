from typing import Optional, Dict, Any
from clients.supabase import supabase_client

class JobRepository:
    """Repository for job-related database operations."""
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a job by ID."""
        try:
            result = supabase_client.client.table('jobs').select('*').eq('id', job_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching job {job_id}: {e}")
            return None
    
    def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """Update a job with new data."""
        try:
            result = supabase_client.client.table('jobs').update(updates).eq('id', job_id).execute()
            print(f"[Supabase] Updated Job {job_id}: {updates}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error updating job {job_id}: {e}", flush=True)
            return False
    
    def create_job(self, job_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new job."""
        try:
            result = supabase_client.client.table('jobs').insert(job_data).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error creating job: {e}")
            return None
    
    def get_jobs_by_status(self, status: str) -> list:
        """Get all jobs with a specific status."""
        try:
            result = supabase_client.client.table('jobs').select('*').eq('status', status).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching jobs with status {status}: {e}")
            return []

# Singleton instance
job_repository = JobRepository()