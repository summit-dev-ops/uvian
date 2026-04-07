from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("ticket.created")
class TicketCreatedTransformer(BaseEventTransformer):
    """Transform ticket.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "ticket.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        
        title = event_data.get("title", "")
        description = event_data.get("description", "")
        priority = event_data.get("priority", "medium")
        space_id = event_data.get("spaceId")
        
        message_content = f"""Event: ticket.created
Actor: {actor_id}
Resource: ticket/{resource_id}
Context: space {space_id}
Title: {title}
Priority: {priority.upper()}"""
        if description:
            message_content += f"\nDescription: {description}"
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "ticket_id": resource_id,
                "title": title,
                "description": description,
                "priority": priority,
                "created_by": actor_id,
                "space_id": space_id,
                "timestamp": timestamp,
            }
        )


@EventTransformerRegistry.register("ticket.updated")
class TicketUpdatedTransformer(BaseEventTransformer):
    """Transform ticket.updated events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "ticket.updated"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        
        status = event_data.get("status", "")
        priority = event_data.get("priority", "")
        
        message_content = f"""Event: ticket.updated
Actor: {actor_id}
Resource: ticket/{resource_id}"""
        if status:
            message_content += f"\nStatus: {status}"
        if priority:
            message_content += f"\nPriority: {priority}"
        timestamp = event_data.get("updatedAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "ticket_id": resource_id,
                "status": status,
                "priority": priority,
                "updated_by": actor_id,
                "timestamp": timestamp,
            }
        )


# Backwards compatibility aliases
TicketCreatedTrigger = TicketCreatedTransformer
TicketUpdatedTrigger = TicketUpdatedTransformer