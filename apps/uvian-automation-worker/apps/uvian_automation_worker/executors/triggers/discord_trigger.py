from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("com.uvian.discord.message_created")
class DiscordMessageCreatedTrigger(BaseTrigger):
    """Handle Discord message.created events."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.discord.message_created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource_data = event_data.get("data", {})
        
        content = resource_data.get("content", "")
        external_channel_id = resource_data.get("externalChannelId", "")
        external_user_id = resource_data.get("externalUserId", "")
        guild_id = resource_data.get("guildId")
        is_dm = resource_data.get("isDm", False)
        
        channel_type = "DM" if is_dm else "channel"
        if guild_id:
            channel_type = f"server channel"
        
        message_content = f"""[Discord] User in {channel_type} said: {content}
External Channel: {external_channel_id}
External User: {external_user_id}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "message_id": resource_data.get("messageId"),
                "external_channel_id": external_channel_id,
                "external_user_id": external_user_id,
                "external_message_id": resource_data.get("externalMessageId"),
                "guild_id": guild_id,
                "is_dm": is_dm,
                "platform": "discord",
            }
        )


@TriggerRegistry.register("com.uvian.discord.interaction_received")
class DiscordInteractionReceivedTrigger(BaseTrigger):
    """Handle Discord interaction events."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.discord.interaction_received"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource_data = event_data.get("data", {})
        
        command_name = resource_data.get("commandName", "unknown")
        options = resource_data.get("options", [])
        external_channel_id = resource_data.get("externalChannelId", "")
        external_user_id = resource_data.get("externalUserId", "")
        
        options_str = ", ".join([f"{o.get('name')}: {o.get('value')}" for o in options]) if options else "none"
        
        message_content = f"""[Discord] User executed slash command: /{command_name}
Options: {options_str}
External Channel: {external_channel_id}
External User: {external_user_id}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "command_name": command_name,
                "options": options,
                "external_channel_id": external_channel_id,
                "external_user_id": external_user_id,
                "platform": "discord",
            }
        )
