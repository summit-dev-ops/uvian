from typing import List, Dict, Any
from clients.supabase import supabase_client
from core.logging import log


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
            log.error("fetch_pending_messages_error", thread_id=thread_id, error=str(e))
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
            log.info("messages_marked_processed", count=len(message_ids))
            return True
        except Exception as e:
            log.error("mark_messages_processed_error", error=str(e))
            return False


thread_inbox_repository = ThreadInboxRepository()
