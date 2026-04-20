from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("com.uvian.space.member_joined")
class SpaceMemberJoinedTransformer(BaseEventTransformer):
    """Transform com.uvian.space.member_joined events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.space.member_joined"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        role = event_data.get("role", "member")
        prefix = "You" if is_self_action else "Actor"
        
        message_content = f"""Event: com.uvian.space.member_joined
{prefix}: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Role: {role}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "user_id": actor_id,
                "role": role,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


@EventTransformerRegistry.register("com.uvian.space.member_role_changed")
class SpaceMemberRoleChangedTransformer(BaseEventTransformer):
    """Transform com.uvian.space.member_role_changed events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.space.member_role_changed"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        old_role = event_data.get("oldRole", "unknown")
        new_role = event_data.get("newRole", "unknown")
        prefix = "You" if is_self_action else "Actor"
        
        message_content = f"""Event: com.uvian.space.member_role_changed
{prefix}: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Changed: {old_role} -> {new_role}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "user_id": actor_id,
                "old_role": old_role,
                "new_role": new_role,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


@EventTransformerRegistry.register("com.uvian.space.created")
class SpaceCreatedTransformer(BaseEventTransformer):
    """Transform com.uvian.space.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.space.created"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId") or resource_id
        
        name = event_data.get("name", "unknown")
        prefix = "You" if is_self_action else "Actor"
        
        message_content = f"""Event: com.uvian.space.created
{prefix}: {actor_id}
Resource: space/{resource_id}
Context: space {space_id}
Name: {name}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "space_id": space_id,
                "name": name,
                "created_by": actor_id,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


# Backwards compatibility aliases
SpaceMemberJoinedTrigger = SpaceMemberJoinedTransformer
SpaceMemberRoleChangedTrigger = SpaceMemberRoleChangedTransformer
SpaceCreatedTrigger = SpaceCreatedTransformer