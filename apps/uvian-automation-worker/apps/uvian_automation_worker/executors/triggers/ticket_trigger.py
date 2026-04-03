from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("ticket.created")
class TicketCreatedTrigger(BaseTrigger):
    """Handle ticket.created events."""
    
    @property
    def event_type(self) -> str:
        return "ticket.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        title = resource_data.get("title", "")
        description = resource_data.get("description", "")
        priority = resource_data.get("priority", "medium")
        
        message_content = f"""Event: ticket.created
Actor: {actor_id}
Resource: ticket/{resource_id}
Context: space {context.get('spaceId')}
Title: {title}
Priority: {priority.upper()}"""
        if description:
            message_content += f"\nDescription: {description}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "ticket_id": resource_id,
                "title": title,
                "description": description,
                "priority": priority,
                "created_by": actor_id,
                "space_id": context.get("spaceId"),
                "timestamp": resource_data.get("createdAt"),
            }
        )


@TriggerRegistry.register("ticket.updated")
class TicketUpdatedTrigger(BaseTrigger):
    """Handle ticket.updated events."""
    
    @property
    def event_type(self) -> str:
        return "ticket.updated"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        
        status = resource_data.get("status", "")
        priority = resource_data.get("priority", "")
        
        message_content = f"""Event: ticket.updated
Actor: {actor_id}
Resource: ticket/{resource_id}"""
        if status:
            message_content += f"\nStatus: {status}"
        if priority:
            message_content += f"\nPriority: {priority}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "ticket_id": resource_id,
                "status": status,
                "priority": priority,
                "updated_by": actor_id,
                "timestamp": resource_data.get("updatedAt"),
            }
        )
