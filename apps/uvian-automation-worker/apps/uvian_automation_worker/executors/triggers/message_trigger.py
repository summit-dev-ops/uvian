from typing import Dict, Any, Optional
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("message.created")
class MessageCreatedTrigger(BaseTrigger):
    """Handle message.created events."""
    
    @property
    def event_type(self) -> str:
        return "message.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor_id = event_data.get("actorId", "unknown")
        message_id = event_data.get("messageId") or event_data.get("id", "")
        conversation_id = event_data.get("conversationId")
        
        content = event_data.get("content", "")
        platform = event_data.get("platform")
        external_channel_id = event_data.get("externalChannelId")
        external_user_id = event_data.get("externalUserId")
        
        if platform and platform != "internal":
            timestamp = event_data.get("createdAt")
            message_content = f"""[{platform}] User said: {content}
External Channel: {external_channel_id or 'unknown'}
External User: {external_user_id or 'unknown'}"""
            if timestamp:
                message_content += f"\nEvent Time: {timestamp}"
            
            return TriggerMessage(
                content=message_content,
                event_type=self.event_type,
                metadata={
                    "message_id": message_id,
                    "conversation_id": conversation_id,
                    "sender_id": actor_id,
                    "asset_ids": event_data.get("assetIds", []),
                    "platform": platform,
                    "external_channel_id": external_channel_id,
                    "external_user_id": external_user_id,
                    "timestamp": timestamp,
                }
            )
        
        timestamp = event_data.get("createdAt")
        message_content = f"""Event: message.created
Actor: {actor_id}
Resource: message/{message_id}
Context: conversation {conversation_id}
Content: {content}"""
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "message_id": message_id,
                "conversation_id": conversation_id,
                "sender_id": actor_id,
                "asset_ids": event_data.get("assetIds", []),
                "timestamp": timestamp,
            }
        )


@TriggerRegistry.register("conversation.member_joined")
class ConversationMemberJoinedTrigger(BaseTrigger):
    """Handle conversation.member_joined events."""
    
    @property
    def event_type(self) -> str:
        return "conversation.member_joined"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor_id = event_data.get("actorId", "unknown")
        resource_id = event_data.get("id", "")
        conversation_id = event_data.get("conversationId")
        
        message_content = f"""Event: conversation.member_joined
Actor: {actor_id}
Resource: conversation/{resource_id}
Context: conversation {conversation_id}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "conversation_id": conversation_id or resource_id,
                "user_id": actor_id,
                "timestamp": timestamp,
            }
        )
