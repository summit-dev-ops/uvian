from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("post.created")
class PostCreatedTrigger(BaseTrigger):
    """Handle post.created events."""
    
    @property
    def event_type(self) -> str:
        return "post.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        message_content = f"""Event: post.created
Actor: {actor_id}
Resource: post/{resource_id}
Context: space {context.get('spaceId')}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "post_id": resource_id,
                "author_id": actor_id,
                "space_id": context.get("spaceId"),
                "timestamp": resource_data.get("createdAt"),
            }
        )


@TriggerRegistry.register("note.updated")
class NoteUpdatedTrigger(BaseTrigger):
    """Handle note.updated events."""
    
    @property
    def event_type(self) -> str:
        return "note.updated"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        
        title = resource_data.get("title", "")
        
        message_content = f"""Event: note.updated
Actor: {actor_id}
Resource: note/{resource_id}
Title: {title}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "note_id": resource_id,
                "title": title,
                "updated_by": actor_id,
                "timestamp": resource_data.get("updatedAt"),
            }
        )


@TriggerRegistry.register("asset.uploaded")
class AssetUploadedTrigger(BaseTrigger):
    """Handle asset.uploaded events."""
    
    @property
    def event_type(self) -> str:
        return "asset.uploaded"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        filename = resource_data.get("filename", "unknown")
        mime_type = resource_data.get("mimeType", "")
        
        message_content = f"""Event: asset.uploaded
Resource: asset/{resource_id}
Filename: {filename}
MimeType: {mime_type}
Context: space {context.get('spaceId')}, conversation {context.get('conversationId')}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "asset_id": resource_id,
                "filename": filename,
                "mime_type": mime_type,
                "size_bytes": resource_data.get("sizeBytes"),
                "space_id": context.get("spaceId"),
                "conversation_id": context.get("conversationId"),
                "timestamp": resource_data.get("createdAt"),
            }
        )
