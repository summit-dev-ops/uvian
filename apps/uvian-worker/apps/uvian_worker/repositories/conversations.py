from typing import List, Dict, Any, Optional
from clients.supabase import supabase_client

class ConversationRepository:
    """Repository for conversation-related database operations."""
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID."""
        try:
            result = supabase_client.client.table('conversations').select('*').eq('id', conversation_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching conversation {conversation_id}: {e}")
            return None
    
    def get_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all conversations, ordered by updated_at desc."""
        try:
            result = supabase_client.client.table('conversations').select('*').order('updated_at', desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching conversations: {e}")
            return []
    
    def create_conversation(self, conversation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new conversation."""
        try:
            result = supabase_client.client.table('conversations').insert(conversation_data).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error creating conversation: {e}")
            return None
    
    def update_conversation(self, conversation_id: str, updates: Dict[str, Any]) -> bool:
        """Update a conversation."""
        try:
            result = supabase_client.client.table('conversations').update(updates).eq('id', conversation_id).execute()
            print(f"[Supabase] Updated conversation {conversation_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error updating conversation {conversation_id}: {e}", flush=True)
            return False
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation (cascades to messages and members)."""
        try:
            result = supabase_client.client.table('conversations').delete().eq('id', conversation_id).execute()
            print(f"[Supabase] Deleted conversation {conversation_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting conversation {conversation_id}: {e}", flush=True)
            return False
    
    def get_conversation_members(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all members of a conversation."""
        try:
            result = supabase_client.client.table('conversation_members').select('*').eq('conversation_id', conversation_id).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching members for conversation {conversation_id}: {e}")
            return []
    
    def add_conversation_member(self, membership_data: Dict[str, Any]) -> bool:
        """Add a member to a conversation."""
        try:
            result = supabase_client.client.table('conversation_members').insert(membership_data).execute()
            print(f"[Supabase] Added member to conversation {membership_data.get('conversation_id')}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error adding conversation member: {e}", flush=True)
            return False
    
    def remove_conversation_member(self, conversation_id: str, user_id: str) -> bool:
        """Remove a member from a conversation."""
        try:
            result = supabase_client.client.table('conversation_members').delete().eq('conversation_id', conversation_id).eq('profile_id', user_id).execute()
            print(f"[Supabase] Removed member {user_id} from conversation {conversation_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error removing conversation member: {e}", flush=True)
            return False

# Singleton instance
conversation_repository = ConversationRepository()