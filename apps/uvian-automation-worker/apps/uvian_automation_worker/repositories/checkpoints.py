"""
Checkpoint repository with consistent parameter naming.
- Database uses snake_case (thread_id, checkpoint_id, checkpoint_data)
- Handles persistence for LangGraph agent states via Supabase.
"""
from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.utils.naming import to_db_format, from_db_format

class CheckpointRepository:
    """Repository for agent checkpoint database operations."""

    def __init__(self):
        self.client = supabase_client.client
        self.table_name = 'agent_checkpoints'

    async def get_checkpoint(
        self, 
        thread_id: str, 
        checkpoint_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific checkpoint or the latest one for a thread.
        
        Args:
            thread_id: The UUID of the process thread.
            checkpoint_id: (Optional) The specific checkpoint ID. 
                           If None, returns the most recent one.
        """
        try:
            query = self.client.schema('core_automation').table(self.table_name).select('*').eq('thread_id', thread_id)

            if checkpoint_id:
                # Fetch specific version
                query = query.eq('checkpoint_id', checkpoint_id)
            else:
                # Fetch latest version
                query = query.order('created_at', desc=True).limit(1)

            result = query.execute()

            if result.data:
                # Return raw data - checkpointer expects snake_case keys
                return dict(result.data[0]) if hasattr(result.data[0], 'keys') else result.data[0]

            return None
        except Exception as e:
            print(f"Error fetching checkpoint for thread {thread_id}: {e}", flush=True)
            return None

    async def insert_checkpoint(self, checkpoint_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insert a new checkpoint.
        
        Expected keys in checkpoint_data:
        - thread_id (uuid)
        - checkpoint_id (text)
        - checkpoint_data (dict/jsonb)
        - metadata (dict/jsonb)
        - parent_id (text, optional)
        """
        try:
            # Explicit mapping to ensure clean insertion into the schema
            # We use to_db_format to handle any potential casing logic defined in your utils
            db_payload = to_db_format(self.table_name, {
                'thread_id': checkpoint_data.get('thread_id'),
                'checkpoint_id': checkpoint_data.get('checkpoint_id'),
                'checkpoint_data': checkpoint_data.get('checkpoint_data'),
                'metadata': checkpoint_data.get('metadata', {}),
                'parent_id': checkpoint_data.get('parent_id')
            })

            result = self.client.schema('core_automation').table(self.table_name).insert(db_payload).execute()

            if result.data:
                return from_db_format(self.table_name, result.data[0])

            return None
        except Exception as e:
            print(f"Error inserting checkpoint for thread {checkpoint_data.get('thread_id')}: {e}", flush=True)
            return None

    async def list_checkpoints(
        self, 
        thread_id: str, 
        limit: int = 10, 
        before_checkpoint_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List checkpoints for a thread (useful for history/time-travel).
        
        Args:
            thread_id: The UUID of the process thread.
            limit: Number of checkpoints to return.
            before_checkpoint_id: Pagination cursor (not strictly implemented in SQL schema logic 
                                  without a sequence ID, but often mapped to created_at).
        """
        try:
            query = self.client.schema('core_automation').table(self.table_name)\
                .select('*')\
                .eq('thread_id', thread_id)\
                .order('created_at', desc=True)\
                .limit(limit)

            # Note: Implementing 'before' pagination efficiently typically requires 
            # knowing the created_at of the target checkpoint, or strictly ordered IDs.
            # For simple use cases, standard limit/offset or created_at filtering works here.
            
            result = query.execute()

            checkpoints = []
            for data in result.data or []:
                checkpoints.append(from_db_format(self.table_name, data))

            return checkpoints
        except Exception as e:
            print(f"Error listing checkpoints for thread {thread_id}: {e}", flush=True)
            return []

# Singleton instance
checkpoint_repository = CheckpointRepository()