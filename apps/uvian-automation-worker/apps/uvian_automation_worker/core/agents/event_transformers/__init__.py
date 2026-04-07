# Event transformer modules - transform events into AI-readable messages
# Import all modules to register transformers with the registry

from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
    # Backwards compatibility aliases
    BaseTrigger,
    TriggerMessage,
    TriggerRegistry,
)
from core.agents.event_transformers.message_transformer import (
    MessageCreatedTransformer,
    ConversationMemberJoinedTransformer,
)
from core.agents.event_transformers.ticket_transformer import (
    TicketCreatedTransformer,
    TicketUpdatedTransformer,
)
from core.agents.event_transformers.content_transformer import (
    PostCreatedTransformer,
    NoteUpdatedTransformer,
    AssetUploadedTransformer,
)
from core.agents.event_transformers.space_transformer import (
    SpaceMemberJoinedTransformer,
    SpaceMemberRoleChangedTransformer,
    SpaceCreatedTransformer,
)
from core.agents.event_transformers.job_transformer import (
    JobCreatedTransformer,
    JobCancelledTransformer,
    JobRetryTransformer,
)
from core.agents.event_transformers.discord_transformer import (
    DiscordMessageCreatedTransformer,
    DiscordInteractionReceivedTransformer,
)
from core.agents.event_transformers.schedule_transformer import ScheduleTriggeredTransformer

__all__ = [
    "BaseEventTransformer",
    "EventMessage",
    "EventTransformerRegistry",
    # Backwards compatibility
    "BaseTrigger",
    "TriggerMessage",
    "TriggerRegistry",
]