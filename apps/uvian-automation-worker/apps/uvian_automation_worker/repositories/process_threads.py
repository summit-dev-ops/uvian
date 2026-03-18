# repositories/process_threads.py
"""
Process Thread repository with consistent parameter naming.
- API uses camelCase (agentProfileId, resourceScopeId)
- Database uses snake_case (profile_id, resource_scope_id)
This repository handles persistent process threads that can be used by any type of executor.
"""
from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.utils.naming import to_db_format, from_db_format

class ProcessThreadRepository:
    """Repository for process thread database operations."""

    def __init__(self):
        self.client = supabase_client.client

    async def create_thread(
        self,
        thread_id: str,
        agent_profile_id: str,
        resource_scope_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new process thread."""
        try:
            # Convert to database format (snake_case)
            thread_data = to_db_format('process_threads', {
                'id': thread_id,
                'agentProfileId': agent_profile_id,
                'resourceScopeId': resource_scope_id,
                'currentStatus': 'active',
                'metadata': metadata or {}
            })

            result = self.client.table('process_threads').insert(thread_data).execute()

            if result.data:
                # Convert Supabase JSON response to dict
                data = dict(result.data[0]) if hasattr(result.data[0], 'keys') else result.data[0]
                return from_db_format('process_threads', data)

            return None
        except Exception as e:
            print(f"Error creating process thread: {e}", flush=True)
            return None

    async def get_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """Get a process thread by ID."""
        try:
            result = self.client.table('process_threads').select('*').eq('id', thread_id).execute()

            if result.data:
                return from_db_format('process_threads', result.data[0])

            return None
        except Exception as e:
            print(f"Error fetching process thread {thread_id}: {e}", flush=True)
            return None

    async def update_thread_status(
        self,
        thread_id: str,
        status: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update process thread status."""
        try:
            update_data = {'currentStatus': status}
            if metadata:
                update_data['metadata'] = metadata

            db_data = to_db_format('process_threads', update_data)
            db_data['updated_at'] = 'now()'

            result = self.client.table('process_threads').update(db_data).eq('id', thread_id).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error updating process thread {thread_id}: {e}", flush=True)
            return False

    async def get_threads_by_agent(self, agent_profile_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all threads for an agent profile."""
        try:
            # Use snake_case for database query
            result = self.client.table('process_threads').select('*').eq('profile_id', agent_profile_id).order('created_at', desc=True).limit(limit).execute()

            threads = []
            for data in result.data or []:
                threads.append(from_db_format('process_threads', data))

            return threads
        except Exception as e:
            print(f"Error fetching process threads for {agent_profile_id}: {e}", flush=True)
            return []

    async def delete_thread(self, thread_id: str) -> bool:
        """Delete a process thread."""
        try:
            result = self.client.table('process_threads').delete().eq('id', thread_id).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting process thread {thread_id}: {e}", flush=True)
            return False

# Singleton instance
process_thread_repository = ProcessThreadRepository()

# Backward compatibility alias
agent_thread_repository = process_thread_repository