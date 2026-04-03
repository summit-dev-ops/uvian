from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("space.member_joined")
class SpaceMemberJoinedTrigger(BaseTrigger):
    """Handle space.member_joined events."""
    
    @property
    def event_type(self) -> str:
        return "space.member_joined"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        role = resource_data.get("role", "member")
        
        message_content = f"""Event: space.member_joined
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {context.get('spaceId') or resource_id}
Role: {role}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": context.get("spaceId") or resource_id,
                "user_id": actor_id,
                "role": role,
                "timestamp": resource_data.get("createdAt"),
            }
        )


@TriggerRegistry.register("space.member_role_changed")
class SpaceMemberRoleChangedTrigger(BaseTrigger):
    """Handle space.member_role_changed events."""
    
    @property
    def event_type(self) -> str:
        return "space.member_role_changed"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        old_role = resource_data.get("oldRole", "unknown")
        new_role = resource_data.get("newRole", "unknown")
        
        message_content = f"""Event: space.member_role_changed
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {context.get('spaceId') or resource_id}
Changed: {old_role} -> {new_role}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": context.get("spaceId") or resource_id,
                "user_id": actor_id,
                "old_role": old_role,
                "new_role": new_role,
                "timestamp": resource_data.get("createdAt"),
            }
        )


@TriggerRegistry.register("space.created")
class SpaceCreatedTrigger(BaseTrigger):
    """Handle space.created events."""
    
    @property
    def event_type(self) -> str:
        return "space.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        name = resource_data.get("name", "unknown")
        
        message_content = f"""Event: space.created
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {context.get('spaceId') or resource_id}
Name: {name}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": context.get("spaceId") or resource_id,
                "name": name,
                "created_by": actor_id,
                "timestamp": resource_data.get("createdAt"),
            }
        )
