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
    """Handle Discord interaction events (slash commands, buttons, selects, modals, context menus)."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.discord.interaction_received"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource_data = event_data.get("data", {})
        
        interaction_type_name = resource_data.get("interactionTypeName", "unknown")
        command_name = resource_data.get("commandName")
        custom_id = resource_data.get("customId")
        options = resource_data.get("options", [])
        values = resource_data.get("values", [])
        modal_data = resource_data.get("modalData", {})
        external_channel_id = resource_data.get("externalChannelId", "")
        external_user_id = resource_data.get("externalUserId", "")
        
        if interaction_type_name == "ChatInputCommand":
            options_str = ", ".join(
                [f"{o.get('name')}: {o.get('value')}" for o in options]
            ) if options else "none"
            message_content = (
                f"[Discord] User executed slash command: /{command_name}\n"
                f"Options: {options_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "MessageComponent":
            values_str = ", ".join(values) if values else "none"
            message_content = (
                f"[Discord] User interacted with component (customId: {custom_id})\n"
                f"Selected values: {values_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "ModalSubmit":
            modal_str = ", ".join(
                [f"{k}: {v}" for k, v in modal_data.items()]
            ) if modal_data else "none"
            message_content = (
                f"[Discord] User submitted modal (customId: {custom_id})\n"
                f"Fields: {modal_str}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        elif interaction_type_name == "ContextMenuCommand":
            message_content = (
                f"[Discord] User used context menu command: {command_name}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        else:
            message_content = (
                f"[Discord] Unknown interaction type: {interaction_type_name}\n"
                f"External Channel: {external_channel_id}\n"
                f"External User: {external_user_id}"
            )
        
        return TriggerMessage(
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
                "platform": "discord",
            }
        )
