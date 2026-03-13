from typing import List, Dict, Any, Optional
from clients.supabase import supabase_client

class ProfileRepository:
    """Repository for profile-related database operations."""

    async def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a profile by its primary ID."""
        try:
            result = supabase_client.client.table('profiles').select('*').eq('id', profile_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching profile {profile_id}: {e}")
            return None

    async def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a profile by the associated Auth user_id."""
        try:
            result = supabase_client.client.table('profiles').select('*').eq('user_id', user_id).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error fetching profile for user_id {user_id}: {e}")
            return None

    async def get_profiles(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all active profiles."""
        try:
            result = supabase_client.client.table('profiles') \
                .select('*') \
                .eq('is_active', True) \
                .order('created_at', desc=True) \
                .limit(limit) \
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching profiles: {e}")
            return []

    async def create_profile(self, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new profile."""
        try:
            result = supabase_client.client.table('profiles').insert(profile_data).execute()
            data = result.data
            return data[0] if data else None
        except Exception as e:
            print(f"Error creating profile: {e}")
            return None

    async def update_profile(self, profile_id: str, updates: Dict[str, Any]) -> bool:
        """Update profile details."""
        try:
            # Explicitly update the updated_at timestamp if not provided
            if 'updated_at' not in updates:
                from datetime import datetime
                updates['updated_at'] = datetime.utcnow().isoformat()
                
            result = supabase_client.client.table('profiles').update(updates).eq('id', profile_id).execute()
            print(f"[Supabase] Updated profile {profile_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error updating profile {profile_id}: {e}", flush=True)
            return False

    async def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile."""
        try:
            result = supabase_client.client.table('profiles').delete().eq('id', profile_id).execute()
            print(f"[Supabase] Deleted profile {profile_id}", flush=True)
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting profile {profile_id}: {e}", flush=True)
            return False

    async def get_agents(self) -> List[Dict[str, Any]]:
        """Helper to specifically fetch profiles that are categorized as agents."""
        try:
            # Using 'agent' as the type check based on common patterns in your schema
            result = supabase_client.client.table('profiles').select('*').eq('type', 'agent').execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching agent profiles: {e}")
            return []

    async def search_profiles(self, query: str) -> List[Dict[str, Any]]:
        """Search profiles by display name."""
        try:
            result = supabase_client.client.table('profiles') \
                .select('*') \
                .ilike('display_name', f'%{query}%') \
                .limit(10) \
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error searching profiles with query {query}: {e}")
            return []

# Singleton instance
profile_repository = ProfileRepository()