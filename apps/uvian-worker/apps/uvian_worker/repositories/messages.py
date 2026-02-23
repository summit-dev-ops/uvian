from typing import List, Dict, Any, Optional
from clients.supabase import supabase_client

class MessageRepository:
    """Repository for message-related database operations."""
    
    async def insert_message(self, message_data: Dict[str, Any]) -> bool:
        """Insert a new message."""
        try:
            result =  supabase_client.client.table('messages').insert(message_data).execute()
            print(f"[Supabase] Inserted message: {message_data.get('id')}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error inserting message: {e}", flush=True)
            return False
    
    async def get_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation."""
        try:
            result =  supabase_client.client.table('messages').select('*').eq('conversation_id', conversation_id).order('created_at', desc=False).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching messages for {conversation_id}: {e}")
            return []
        
    async def get_messages_with_profiles(
        self, 
        conversation_id: str, 
        limit: int = 50, 
        before_timestamp: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get messages enriched with the sender's profile information.
        Uses cursor-based pagination (before_timestamp) to securely fetch older history.
        """
        try:
            # Join the profile using the foreign key constraint: messages_sender_id_fkey
            # We select specific profile fields to keep the payload clean
            query = supabase_client.client.table('messages').select(
                '*, profile:profiles!messages_sender_id_fkey(id, display_name, type)'
            ).eq('conversation_id', conversation_id)
            
            # If fetching older messages, apply the cursor
            if before_timestamp:
                query = query.lt('created_at', before_timestamp)
                
            # Order DESCENDING to get the X messages immediately preceding the cursor
            query = query.order('created_at', desc=True).limit(limit)
            
            result = query.execute()
            messages = result.data or []
            
            # We fetched them descending to get the correct slice of time, 
            # but we must reverse them so the transcript reads chronologically (oldest -> newest)
            messages.reverse()
            
            return messages
        except Exception as e:
            print(f"Error fetching populated messages for {conversation_id}: {e}")
            return []

    async def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific message by ID."""
        try:
            result =  supabase_client.client.table('messages').select('*').eq('id', message_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching message {message_id}: {e}")
            return None
    
    async def update_message(self, message_id: str, updates: Dict[str, Any]) -> bool:
        """Update a message."""
        try:
            result =  supabase_client.client.table('messages').update(updates).eq('id', message_id).execute()
            print(f"[Supabase] Updated message {message_id}", flush=True)
            return result.data
        except Exception as e:
            print(f"Error updating message {message_id}: {e}", flush=True)
            return False
    
    async def delete_message(self, message_id: str) -> bool:
        """Delete a message."""
        try:
            result =  supabase_client.client.table('messages').delete().eq('id', message_id).execute()
            print(f"[Supabase] Deleted message {message_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting message {message_id}: {e}", flush=True)
            return False

# Singleton instance
message_repository = MessageRepository()