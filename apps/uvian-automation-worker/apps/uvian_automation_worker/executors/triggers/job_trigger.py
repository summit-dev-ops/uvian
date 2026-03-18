from typing import Dict, Any
from executors.triggers.base import BaseTrigger, TriggerMessage, TriggerRegistry


@TriggerRegistry.register("job.created")
class JobCreatedTrigger(BaseTrigger):
    """Handle job.created events."""
    
    @property
    def event_type(self) -> str:
        return "job.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        actor = event_data.get("actor", {})
        actor_id = actor.get("id", "unknown")
        actor_type = actor.get("type", "system")
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        resource_data = resource.get("data", {})
        
        job_type = resource_data.get("jobType", "unknown")
        
        message_content = f"""Event: job.created
Actor: {actor_id} ({actor_type})
Resource: job/{resource_id}
JobType: {job_type}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
                "job_type": job_type,
                "actor_id": actor_id,
                "actor_type": actor_type,
                "input_payload": resource_data.get("inputPayload"),
            }
        )


@TriggerRegistry.register("job.cancelled")
class JobCancelledTrigger(BaseTrigger):
    """Handle job.cancelled events."""
    
    @property
    def event_type(self) -> str:
        return "job.cancelled"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        
        message_content = f"""Event: job.cancelled
Resource: job/{resource_id}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
            }
        )


@TriggerRegistry.register("job.retry")
class JobRetryTrigger(BaseTrigger):
    """Handle job.retry events."""
    
    @property
    def event_type(self) -> str:
        return "job.retry"
    
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        resource = event_data.get("resource", {})
        resource_id = resource.get("id", "unknown")
        
        message_content = f"""Event: job.retry
Resource: job/{resource_id}"""
        
        return TriggerMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
            }
        )
