# Backwards compatibility - re-export from new event_transformers location
from core.agents.event_transformers import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
    BaseTrigger,
    TriggerMessage,
    TriggerRegistry,
)

# Import all transformers to register them
from core.agents.event_transformers.message_transformer import (
    MessageCreatedTransformer,
    ConversationMemberJoinedTransformer,
    MessageCreatedTrigger,
    ConversationMemberJoinedTrigger,
)
from core.agents.event_transformers.ticket_transformer import (
    TicketCreatedTransformer,
    TicketUpdatedTransformer,
    TicketCreatedTrigger,
    TicketUpdatedTrigger,
)
from core.agents.event_transformers.content_transformer import (
    PostCreatedTransformer,
    NoteUpdatedTransformer,
    AssetUploadedTransformer,
    PostCreatedTrigger,
    NoteUpdatedTrigger,
    AssetUploadedTrigger,
)
from core.agents.event_transformers.space_transformer import (
    SpaceMemberJoinedTransformer,
    SpaceMemberRoleChangedTransformer,
    SpaceCreatedTransformer,
    SpaceMemberJoinedTrigger,
    SpaceMemberRoleChangedTrigger,
    SpaceCreatedTrigger,
)
from core.agents.event_transformers.job_transformer import (
    JobCreatedTransformer,
    JobCancelledTransformer,
    JobRetryTransformer,
    JobCreatedTrigger,
    JobCancelledTrigger,
    JobRetryTrigger,
)
from core.agents.event_transformers.discord_transformer import (
    DiscordMessageCreatedTransformer,
    DiscordInteractionReceivedTransformer,
    DiscordMessageCreatedTrigger,
    DiscordInteractionReceivedTrigger,
)
from core.agents.event_transformers.schedule_transformer import (
    ScheduleTriggeredTransformer,
    ScheduleTriggeredTrigger,
)

__all__ = [
    "BaseEventTransformer",
    "EventMessage",
    "EventTransformerRegistry",
    "BaseTrigger",
    "TriggerMessage",
    "TriggerRegistry",
    "MessageCreatedTransformer",
    "ConversationMemberJoinedTransformer",
    "MessageCreatedTrigger",
    "ConversationMemberJoinedTrigger",
    "TicketCreatedTransformer",
    "TicketUpdatedTransformer",
    "TicketCreatedTrigger",
    "TicketUpdatedTrigger",
    "PostCreatedTransformer",
    "NoteUpdatedTransformer",
    "AssetUploadedTransformer",
    "PostCreatedTrigger",
    "NoteUpdatedTrigger",
    "AssetUploadedTrigger",
    "SpaceMemberJoinedTransformer",
    "SpaceMemberRoleChangedTransformer",
    "SpaceCreatedTransformer",
    "SpaceMemberJoinedTrigger",
    "SpaceMemberRoleChangedTrigger",
    "SpaceCreatedTrigger",
    "JobCreatedTransformer",
    "JobCancelledTransformer",
    "JobRetryTransformer",
    "JobCreatedTrigger",
    "JobCancelledTrigger",
    "JobRetryTrigger",
    "DiscordMessageCreatedTransformer",
    "DiscordInteractionReceivedTransformer",
    "DiscordMessageCreatedTrigger",
    "DiscordInteractionReceivedTrigger",
    "ScheduleTriggeredTransformer",
    "ScheduleTriggeredTrigger",
]