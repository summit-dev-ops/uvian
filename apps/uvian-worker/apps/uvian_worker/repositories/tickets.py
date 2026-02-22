# repositories/tickets.py
"""
Ticket repository with consistent parameter naming.
- API uses camelCase (resourceScopeId, agentProfileId)
- Database uses snake_case (resource_scope_id, agent_profile_id)
"""
from typing import Optional, Dict, Any, List
from clients.supabase import supabase_client
from core.utils.naming import to_db_format, from_db_format

class TicketRepository:
    """Repository for ticket database operations."""
    
    def __init__(self):
        self.client = supabase_client.client
    
    async def create_ticket(
        self,
        thread_id: str,
        resource_scope_id: str,
        title: str,
        description: str,
        priority: str = "medium",
        assigned_to: Optional[str] = None,
        requester_job_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new ticket."""
        try:
            # Convert to database format (snake_case)
            ticket_data = to_db_format('tickets', {
                'threadId': thread_id,
                'resourceScopeId': resource_scope_id,
                'title': title,
                'description': description,
                'priority': priority,
                'status': 'open',
                'assignedTo': assigned_to,
                'requesterJobId': requester_job_id
            })
            
            result = self.client.table('tickets').insert(ticket_data).execute()
            
            if result.data:
                return from_db_format('tickets', result.data[0])
            
            return None
        except Exception as e:
            print(f"Error creating ticket: {e}", flush=True)
            return None
    
    async def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get a ticket by ID."""
        try:
            result = self.client.table('tickets').select('*').eq('id', ticket_id).execute()
            
            if result.data:
                return from_db_format('tickets', result.data[0])
            
            return None
        except Exception as e:
            print(f"Error fetching ticket {ticket_id}: {e}", flush=True)
            return None
    
    async def get_tickets_by_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        """Get all tickets for a thread."""
        try:
            # Use snake_case for database query
            result = self.client.table('tickets').select('*').eq('thread_id', thread_id).order('created_at', desc=True).execute()
            
            tickets = []
            for data in result.data or []:
                tickets.append(from_db_format('tickets', data))
            
            return tickets
        except Exception as e:
            print(f"Error fetching tickets for thread {thread_id}: {e}", flush=True)
            return []
    
    async def get_tickets_by_scope(self, resource_scope_id: str, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get tickets by resource scope."""
        try:
            query = self.client.table('tickets').select('*').eq('resource_scope_id', resource_scope_id)
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            tickets = []
            for data in result.data or []:
                tickets.append(from_db_format('tickets', data))
            
            return tickets
        except Exception as e:
            print(f"Error fetching tickets for scope {resource_scope_id}: {e}", flush=True)
            return []
    
    async def update_ticket(
        self,
        ticket_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a ticket."""
        try:
            # Convert updates to database format
            db_updates = to_db_format('tickets', updates)
            db_updates['updated_at'] = 'now()'
            
            result = self.client.table('tickets').update(db_updates).eq('id', ticket_id).execute()
            
            if result.data:
                return from_db_format('tickets', result.data[0])
            
            return None
        except Exception as e:
            print(f"Error updating ticket {ticket_id}: {e}", flush=True)
            return None
    
    async def resolve_ticket(self, ticket_id: str, resolution_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Resolve a ticket with resolution data."""
        try:
            updates = {
                'status': 'resolved',
                'resolutionPayload': resolution_payload
            }
            
            return await self.update_ticket(ticket_id, updates)
        except Exception as e:
            print(f"Error resolving ticket {ticket_id}: {e}", flush=True)
            return None
    
    async def assign_ticket(self, ticket_id: str, assigned_to: Optional[str]) -> Optional[Dict[str, Any]]:
        """Assign or unassign a ticket."""
        try:
            updates = {'assignedTo': assigned_to}
            
            return await self.update_ticket(ticket_id, updates)
        except Exception as e:
            print(f"Error assigning ticket {ticket_id}: {e}", flush=True)
            return None
    
    async def delete_ticket(self, ticket_id: str) -> bool:
        """Delete a ticket."""
        try:
            result = self.client.table('tickets').delete().eq('id', ticket_id).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting ticket {ticket_id}: {e}", flush=True)
            return False

# Singleton instance
ticket_repository = TicketRepository()