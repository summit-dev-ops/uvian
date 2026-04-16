"""
Checkpoint repository with consistent parameter naming.
- Database uses snake_case (thread_id, checkpoint_id, checkpoint_data)
- Handles persistence for LangGraph agent states via Supabase.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.utils.naming import to_db_format, from_db_format
from core.logging import log

_executor = ThreadPoolExecutor(max_workers=4)


class CheckpointRepository:
    """Repository for agent checkpoint database operations."""

    def __init__(self):
        self.client = supabase_client.client
        self.table_name = 'agent_checkpoints'

    def _get_checkpoint_sync(
        self, 
        thread_id: str, 
        checkpoint_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Synchronous DB call - runs in thread pool to avoid blocking event loop."""
        try:
            query = self.client.schema('core_automation').table(self.table_name).select('*').eq('thread_id', thread_id)

            if checkpoint_id:
                query = query.eq('checkpoint_id', checkpoint_id)
            else:
                query = query.order('created_at', desc=True).limit(1)

            result = query.execute()

            if result.data:
                return dict(result.data[0]) if hasattr(result.data[0], 'keys') else result.data[0]

            return None
        except Exception as e:
            log.error("fetch_checkpoint_error", thread_id=thread_id, checkpoint_id=checkpoint_id, error=str(e))
            return None

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
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, 
            self._get_checkpoint_sync, 
            thread_id, 
            checkpoint_id
        )

    def _insert_checkpoint_sync(self, checkpoint_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Synchronous DB call - runs in thread pool to avoid blocking event loop."""
        try:
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
            log.error("insert_checkpoint_error", thread_id=checkpoint_data.get('thread_id'), error=str(e))
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
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, 
            self._insert_checkpoint_sync, 
            checkpoint_data
        )

    def _list_checkpoints_sync(
        self, 
        thread_id: str, 
        limit: int = 10, 
        before_checkpoint_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Synchronous DB call - runs in thread pool to avoid blocking event loop."""
        try:
            query = self.client.schema('core_automation').table(self.table_name)\
                .select('*')\
                .eq('thread_id', thread_id)\
                .order('created_at', desc=True)\
                .limit(limit)
            
            result = query.execute()

            checkpoints = []
            for data in result.data or []:
                checkpoints.append(from_db_format(self.table_name, data))

            return checkpoints
        except Exception as e:
            log.error("list_checkpoints_error", thread_id=thread_id, error=str(e))
            return []

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
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            _executor, 
            self._list_checkpoints_sync, 
            thread_id, 
            limit, 
            before_checkpoint_id
        )

# Singleton instance
checkpoint_repository = CheckpointRepository()