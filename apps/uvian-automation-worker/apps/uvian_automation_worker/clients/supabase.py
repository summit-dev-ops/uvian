import os
from typing import Optional, Dict, Any

from supabase import create_client
from core.logging import worker_logger


class SupabaseClient:
    """Base Supabase client for database operations."""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SECRET_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SECRET_KEY must be set")
            
        self.client = create_client(supabase_url, supabase_key)
        worker_logger.info("Initialized official Supabase client")
    
    def health_check(self) -> bool:
        """Verify the connection to Supabase."""
        try:
            result = self.client.schema('core_automation').table('jobs').select('id').limit(1).execute()
            return True
        except Exception as e:
            worker_logger.error("Supabase health check failed", extra={"error": str(e)})
            return False

supabase_client = SupabaseClient()
