from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("com.uvian.discord.message_created")
class DiscordMessageCreatedTransformer(BaseEventTransformer):
    """Transform Discord message.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.discord.message_created"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        content = event_data.get("content", "")
        external_channel_id = event_data.get("externalChannelId", "")
        external_user_id = event_data.get("externalUserId", "")
        guild_id = event_data.get("guildId")
        is_dm = event_data.get("isDm", False)
        message_id = event_data.get("messageId") or event_data.get("externalMessageId")
        actor_id = event_data.get("actorId", "unknown")
        
        channel_type = "DM" if is_dm else "channel"
        if guild_id:
            channel_type = "server channel"
        
        timestamp = event_data.get("timestamp") or event_data.get("createdAt")
        
        if is_self_action:
            prefix = "You"
        else:
            prefix = "User"
        
        message_content = f"""[Discord] {prefix} in {channel_type} said: {content}
External Channel: {external_channel_id}
External User: {external_user_id}"""
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "message_id": message_id,
                "external_channel_id": external_channel_id,
                "external_user_id": external_user_id,
                "external_message_id": event_data.get("externalMessageId"),
                "guild_id": guild_id,
                "is_dm": is_dm,
                "platform": "discord",
                "actor_id": actor_id,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


@EventTransformerRegistry.register("com.uvian.discord.interaction_received")
class DiscordInteractionReceivedTransformer(BaseEventTransformer):
    """Transform Discord interaction events (slash commands, buttons, selects, modals) into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.discord.interaction_received"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        interaction_type_name = event_data.get("interactionTypeName", "unknown")
        command_name = event_data.get("commandName")
        custom_id = event_data.get("customId")
        options = event_data.get("options", [])
        values = event_data.get("values", [])
        modal_data = event_data.get("modalData", {})
        external_channel_id = event_data.get("externalChannelId", "")
        external_user_id = event_data.get("externalUserId", "")
        actor_id = event_data.get("actorId", "unknown")
        
        prefix = "You" if is_self_action else "User"
        
        if interaction_type_name == "ChatInputCommand":
            options_str = ", ".join(
                [f"{o.get('name')}: {o.get('value')}" for o in options]
            ) if options else "none"
            message_content = (
                f"[Discord] {prefix} executed slash command: /{command_name}\n"
                f"Options: {options_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "MessageComponent":
            values_str = ", ".join(values) if values else "none"
            message_content = (
                f"[Discord] {prefix} interacted with component (customId: {custom_id})\n"
                f"Selected values: {values_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "ModalSubmit":
            modal_str = ", ".join(
                [f"{k}: {v}" for k, v in modal_data.items()]
            ) if modal_data else "none"
            message_content = (
                f"[Discord] {prefix} submitted modal (customId: {custom_id})\n"
                f"Fields: {modal_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "ContextMenuCommand":
            message_content = (
                f"[Discord] {prefix} used context menu command: {command_name}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        else:
            message_content = (
                f"[Discord] {prefix} triggered interaction: {interaction_type_name}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        
        timestamp = event_data.get("timestamp") or event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "interaction_type_name": interaction_type_name,
                "command_name": command_name,
                "custom_id": custom_id,
                "options": options,
                "values": values,
                "modal_data": modal_data,
                "external_channel_id": external_channel_id,
                "external_user_id": external_user_id,
                "actor_id": actor_id,
                "platform": "discord",
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


# Backwards compatibility aliases
DiscordMessageCreatedTrigger = DiscordMessageCreatedTransformer
DiscordInteractionReceivedTrigger = DiscordInteractionReceivedTransformer