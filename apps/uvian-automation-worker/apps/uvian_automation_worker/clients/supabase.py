import os
from typing import Optional, Dict, Any

# Import the official Supabase client
from supabase import create_client

class SupabaseClient:
    """Base Supabase client for database operations."""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SECRET_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SECRET_KEY must be set")
            
        # Initialize the official Supabase client
        self.client = create_client(supabase_url, supabase_key)
        print("Initialized official Supabase client")
    
    def health_check(self) -> bool:
        """Verify the connection to Supabase."""
        try:
            # Simple query to test connectivity
            result = self.client.table('jobs').select('id').limit(1).execute()
            return True
        except Exception as e:
            print(f"Supabase health check failed: {e}")
            return False

# Singleton instance
supabase_client = SupabaseClient()