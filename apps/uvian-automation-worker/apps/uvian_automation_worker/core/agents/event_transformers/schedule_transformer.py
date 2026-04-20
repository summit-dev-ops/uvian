import json
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

    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        schedule_id = event_data.get("scheduleId", "unknown")
        schedule_type = event_data.get("type", "one_time")
        fired_at = event_data.get("firedAt", "unknown")
        payload = event_data.get("eventData", {})

        last_executed = event_data.get("last_executed_at") or event_data.get("lastExecutedAt") or "never"
        last_successful = event_data.get("last_successful_executed_at") or event_data.get("lastSuccessfulExecutedAt") or "never"

        description = payload.get("description", payload.get("message", "Scheduled task execution"))

        context_parts = []
        if description:
            context_parts.append(f"Task: {description}")
        context_parts.append(f"Schedule ID: {schedule_id}")
        context_parts.append(f"Schedule type: {schedule_type}")
        context_parts.append(f"Fired at: {fired_at}")
        context_parts.append(f"Current Time: {{current_time}}")
        context_parts.append(f"Last executed: {last_executed}")
        context_parts.append(f"Last successful: {last_successful}")

        if payload:
            extra = {k: v for k, v in payload.items() if k not in ("description", "message")}
            if extra:
                context_parts.append(f"\n## Event Data (action payload)\n{json.dumps(extra, indent=2)}")

        action_instructions = """

## ACTION REQUIRED

1. Use the **get_schedule** tool to verify this schedule is still active and get its full details
2. Execute the scheduled task using appropriate tools based on the event_data above
3. After execution, use the **mark_schedule_executed** tool to record the result:
   - If successful: mark_schedule_executed with success=true
   - If failed: mark_schedule_executed with success=false
4. Do NOT assume the task is handled - you MUST call tools to verify and execute

IMPORTANT: You must call mark_schedule_executed after handling this event, regardless of outcome."""

        message_content = (
            f"Scheduled task triggered.\n\n"
            + "\n".join(context_parts)
            + action_instructions
        )

        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "scheduleId": schedule_id,
                "scheduleType": schedule_type,
                "firedAt": fired_at,
                "lastExecutedAt": last_executed,
                "lastSuccessfulExecutedAt": last_successful,
                "eventData": payload,
                "is_self_action": is_self_action,
            },
        )


# Backwards compatibility aliases
ScheduleTriggeredTrigger = ScheduleTriggeredTransformer