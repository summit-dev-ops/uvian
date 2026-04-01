# Import all trigger modules to register them with the registry
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry
from executors.triggers.message_trigger import (
    MessageCreatedTrigger,
    ConversationMemberJoinedTrigger,
)
from executors.triggers.ticket_trigger import (
    TicketCreatedTrigger,
    TicketUpdatedTrigger,
)
from executors.triggers.content_trigger import (
    PostCreatedTrigger,
    NoteUpdatedTrigger,
    AssetUploadedTrigger,
)
from executors.triggers.space_trigger import (
    SpaceMemberJoinedTrigger,
    SpaceMemberRoleChangedTrigger,
    SpaceCreatedTrigger,
)
from executors.triggers.job_trigger import (
    JobCreatedTrigger,
    JobCancelledTrigger,
    JobRetryTrigger,
)
from executors.triggers.discord_trigger import (
    DiscordMessageCreatedTrigger,
    DiscordInteractionReceivedTrigger,
)
from executors.triggers.schedule_trigger import ScheduleTriggeredTrigger

__all__ = [
    "BaseTrigger",
    "TriggerMessage", 
    "TriggerRegistry",
]
