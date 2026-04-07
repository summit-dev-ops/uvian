from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("post.created")
class PostCreatedTransformer(BaseEventTransformer):
    """Transform post.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "post.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId")
        
        message_content = f"""Event: post.created
Actor: {actor_id}
Resource: post/{resource_id}
Context: space {space_id}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "post_id": resource_id,
                "author_id": actor_id,
                "space_id": space_id,
                "timestamp": timestamp,
            }
        )


@EventTransformerRegistry.register("note.updated")
class NoteUpdatedTransformer(BaseEventTransformer):
    """Transform note.updated events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "note.updated"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "unknown")
        
        title = event_data.get("title", "")
        
        message_content = f"""Event: note.updated
Actor: {actor_id}
Resource: note/{resource_id}
Title: {title}"""
        timestamp = event_data.get("updatedAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "note_id": resource_id,
                "title": title,
                "updated_by": actor_id,
                "timestamp": timestamp,
            }
        )


@EventTransformerRegistry.register("asset.uploaded")
class AssetUploadedTransformer(BaseEventTransformer):
    """Transform asset.uploaded events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "asset.uploaded"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        resource_id = event_data.get("id", "unknown")
        space_id = event_data.get("spaceId")
        conversation_id = event_data.get("conversationId")
        
        filename = event_data.get("filename", "unknown")
        mime_type = event_data.get("mimeType", "")
        
        message_content = f"""Event: asset.uploaded
Resource: asset/{resource_id}
Filename: {filename}
MimeType: {mime_type}
Context: space {space_id}, conversation {conversation_id}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "asset_id": resource_id,
                "filename": filename,
                "mime_type": mime_type,
                "size_bytes": event_data.get("sizeBytes"),
                "space_id": space_id,
                "conversation_id": conversation_id,
                "timestamp": timestamp,
            }
        )


# Backwards compatibility aliases
PostCreatedTrigger = PostCreatedTransformer
NoteUpdatedTrigger = NoteUpdatedTransformer
AssetUploadedTrigger = AssetUploadedTransformer