from typing import List, Dict, Any
from clients.supabase import supabase_client
from core.logging import worker_logger


class ThreadInboxRepository:
    def __init__(self):
        self.db = supabase_client.client.schema("core_automation")

    async def fetch_pending_messages(self, thread_id: str) -> List[Dict[str, Any]]:
        """Fetch all pending messages for a given thread_id, ordered by creation time."""
        try:
            result = (
                self.db.table("thread_inbox")
                .select("*")
                .eq("thread_id", thread_id)
                .eq("status", "pending")
                .order("created_at", desc=False)
                .execute()
            )
            return result.data or []
        except Exception as e:
            worker_logger.error(
                f"Failed to fetch pending messages for thread {thread_id}: {e}"
            )
            return []

    async def mark_processed(self, message_ids: List[str]) -> bool:
        """Mark messages as processed by their IDs."""
        if not message_ids:
            return True

        try:
            (
                self.db.table("thread_inbox")
                .update({"status": "processed"})
                .in_("id", message_ids)
                .execute()
            )
            worker_logger.info(f"Marked {len(message_ids)} messages as processed")
            return True
        except Exception as e:
            worker_logger.error(f"Failed to mark messages as processed: {e}")
            return False


thread_inbox_repository = ThreadInboxRepository()
