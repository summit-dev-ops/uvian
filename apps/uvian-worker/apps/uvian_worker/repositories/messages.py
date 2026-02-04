from typing import List, Dict, Any, Optional
from clients.supabase import supabase_client

class MessageRepository:
    """Repository for message-related database operations."""
    
    def insert_message(self, message_data: Dict[str, Any]) -> bool:
        """Insert a new message."""
        try:
            result = supabase_client.client.table('messages').insert(message_data).execute()
            print(f"[Supabase] Inserted message: {message_data.get('id')}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error inserting message: {e}", flush=True)
            return False
    
    def get_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation."""
        try:
            result = supabase_client.client.table('messages').select('*').eq('conversation_id', conversation_id).order('created_at', desc=False).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching messages for {conversation_id}: {e}")
            return []
    
    def get_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific message by ID."""
        try:
            result = supabase_client.client.table('messages').select('*').eq('id', message_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching message {message_id}: {e}")
            return None
    
    def update_message(self, message_id: str, updates: Dict[str, Any]) -> bool:
        """Update a message."""
        try:
            result = supabase_client.client.table('messages').update(updates).eq('id', message_id).execute()
            print(f"[Supabase] Updated message {message_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error updating message {message_id}: {e}", flush=True)
            return False
    
    def delete_message(self, message_id: str) -> bool:
        """Delete a message."""
        try:
            result = supabase_client.client.table('messages').delete().eq('id', message_id).execute()
            print(f"[Supabase] Deleted message {message_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting message {message_id}: {e}", flush=True)
            return False

# Singleton instance
message_repository = MessageRepository()