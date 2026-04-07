from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("space.member_joined")
class SpaceMemberJoinedTrigger(BaseTrigger):
    """Handle space.member_joined events."""
    
    @property
    def event_type(self) -> str:
        return "space.member_joined"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        role = event_data.get("role", "member")
        
        message_content = f"""Event: space.member_joined
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Role: {role}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "user_id": actor_id,
                "role": role,
                "timestamp": timestamp,
            }
        )


@TriggerRegistry.register("space.member_role_changed")
class SpaceMemberRoleChangedTrigger(BaseTrigger):
    """Handle space.member_role_changed events."""
    
    @property
    def event_type(self) -> str:
        return "space.member_role_changed"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        old_role = event_data.get("oldRole", "unknown")
        new_role = event_data.get("newRole", "unknown")
        
        message_content = f"""Event: space.member_role_changed
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Changed: {old_role} -> {new_role}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "user_id": actor_id,
                "old_role": old_role,
                "new_role": new_role,
                "timestamp": timestamp,
            }
        )


@TriggerRegistry.register("space.created")
class SpaceCreatedTrigger(BaseTrigger):
    """Handle space.created events."""
    
    @property
    def event_type(self) -> str:
        return "space.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        name = event_data.get("name", "unknown")
        
        message_content = f"""Event: space.created
Actor: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Name: {name}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "name": name,
                "created_by": actor_id,
                "timestamp": timestamp,
            }
        )
