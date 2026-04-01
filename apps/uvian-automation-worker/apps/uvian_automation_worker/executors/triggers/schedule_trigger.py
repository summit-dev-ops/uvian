from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("schedule.triggered")
class ScheduleTriggeredTrigger(BaseTrigger):
    """Handle schedule.triggered events."""
    
    @property
    def event_type(self) -> str:
        return "schedule.triggered"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource = event_data.get("resource", {})
        resource_data = resource.get("data", {})
        
        schedule_id = resource_data.get("scheduleId", "unknown")
        description = resource_data.get("description", "No task description provided")
        
        message_content = f"""Task to execute: {description}

Schedule ID: {schedule_id}

Please execute this scheduled task."""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "scheduleId": schedule_id,
                "description": description,
            }
        )