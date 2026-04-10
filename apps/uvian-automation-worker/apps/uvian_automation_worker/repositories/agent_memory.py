from typing import Dict, Any, Optional
from clients.supabase import supabase_client
from core.logging import log


class AgentMemoryRepository:
    def __init__(self):
        self.db = supabase_client.client.schema("core_automation")

    async def get_all_memory(self, agent_id: str) -> Dict[str, Any]:
        """Fetch all memory entries for a given agent_id as a dict keyed by memory key."""
        if not agent_id:
            return {}
        
        try:
            result = (
                self.db.table("agent_shared_memory")
                .select("key, value")
                .eq("agent_id", agent_id)
                .execute()
            )
            
            memory_dict = {}
            for row in result.data or []:
                key = row.get("key")
                value = row.get("value")
                if key:
                    memory_dict[key] = value
            
            return memory_dict
        except Exception as e:
            log.error("fetch_agent_memory_error", agent_id=agent_id, error=str(e))
            return {}

    async def get_memory_by_key(self, agent_id: str, key: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific memory entry by agent_id and key."""
        if not agent_id or not key:
            return None
        
        try:
            result = (
                self.db.table("agent_shared_memory")
                .select("key, value")
                .eq("agent_id", agent_id)
                .eq("key", key)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0].get("value")
            return None
        except Exception as e:
            log.error("fetch_memory_by_key_error", agent_id=agent_id, key=key, error=str(e))
            return None


agent_memory_repository = AgentMemoryRepository()
