from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("com.uvian.schedule.schedule_fired")
class ScheduleTriggeredTransformer(BaseEventTransformer):
    """Transform com.uvian.schedule.schedule_fired events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.schedule.schedule_fired"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        schedule_id = event_data.get("scheduleId", "unknown")
        schedule_type = event_data.get("type", "one_time")
        fired_at = event_data.get("firedAt", "unknown")
        payload = event_data.get("eventData", {})
        
        description = payload.get("description", payload.get("message", "Scheduled task execution"))
        
        context_parts = []
        if description:
            context_parts.append(f"Task: {description}")
        context_parts.append(f"Schedule ID: {schedule_id}")
        context_parts.append(f"Schedule type: {schedule_type}")
        context_parts.append(f"Fired at: {fired_at}")
        context_parts.append(f"Current Time: {{current_time}}")
        
        if payload:
            extra = {k: v for k, v in payload.items() if k not in ("description", "message")}
            if extra:
                context_parts.append(f"Additional data: {extra}")
        
        message_content = (
            f"Scheduled task triggered.\n\n"
            + "\n".join(context_parts)
            + "\n\nPlease execute this scheduled task."
        )
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "scheduleId": schedule_id,
                "scheduleType": schedule_type,
                "firedAt": fired_at,
                "eventData": payload,
            },
        )


# Backwards compatibility aliases
ScheduleTriggeredTrigger = ScheduleTriggeredTransformer