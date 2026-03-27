from typing import Dict, Any, Optional
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("message.created")
class MessageCreatedTrigger(BaseTrigger):
    """Handle message.created events."""
    
    @property
    def event_type(self) -> str:
        return "message.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "")
        resource_data = resource.get("data", {})
        context = event_data.get("context", {})
        
        content = resource_data.get("content", "")
        platform = resource_data.get("platform")
        external_channel_id = resource_data.get("externalChannelId")
        external_user_id = resource_data.get("externalUserId")
        
        if platform and platform != "internal":
            message_content = f"""[{platform}] User said: {content}
External Channel: {external_channel_id or 'unknown'}
External User: {external_user_id or 'unknown'}"""
            
            return TriggerMessage(
                content=message_content,
                event_type=self.event_type,
                metadata={
                    "message_id": resource_id,
                    "conversation_id": context.get("conversationId"),
                    "sender_id": actor_id,
                    "asset_ids": resource_data.get("assetIds", []),
                    "platform": platform,
                    "external_channel_id": external_channel_id,
                    "external_user_id": external_user_id,
                }
            )
        
        message_content = f"""Event: message.created
Actor: {actor_id}
Resource: message/{resource_id}
Context: conversation {context.get('conversationId')}
Content: {content}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "message_id": resource_id,
                "conversation_id": context.get("conversationId"),
                "sender_id": actor_id,
                "asset_ids": resource_data.get("assetIds", []),
            }
        )


@TriggerRegistry.register("conversation.member_joined")
class ConversationMemberJoinedTrigger(BaseTrigger):
    """Handle conversation.member_joined events."""
    
    @property
    def event_type(self) -> str:
        return "conversation.member_joined"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "")
        context = event_data.get("context", {})
        
        message_content = f"""Event: conversation.member_joined
Actor: {actor_id}
Resource: conversation/{resource_id}
Context: conversation {context.get('conversationId')}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "conversation_id": context.get("conversationId") or resource_id,
                "user_id": actor_id,
            }
        )
