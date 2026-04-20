from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("com.uvian.job.created")
class JobCreatedTransformer(BaseEventTransformer):
    """Transform com.uvian.job.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.job.created"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        actor_type = event_data.get("actorType", "system")
        resource_id = event_data.get("id", "unknown")
        
        job_type = event_data.get("jobType", "unknown")
        prefix = "You" if is_self_action else "Actor"
        
        message_content = f"""Event: com.uvian.job.created
{prefix}: {actor_id} ({actor_type})
Resource: job/{resource_id}
JobType: {job_type}"""
        timestamp = event_data.get("createdAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
                "job_type": job_type,
                "actor_id": actor_id,
                "actor_type": actor_type,
                "input_payload": event_data.get("inputPayload"),
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


@EventTransformerRegistry.register("com.uvian.job.cancelled")
class JobCancelledTransformer(BaseEventTransformer):
    """Transform com.uvian.job.cancelled events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.job.cancelled"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        resource_id = event_data.get("id", "unknown")
        
        message_content = f"""Event: com.uvian.job.cancelled
Resource: job/{resource_id}"""
        timestamp = event_data.get("createdAt") or event_data.get("updatedAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


@EventTransformerRegistry.register("com.uvian.job.retry")
class JobRetryTransformer(BaseEventTransformer):
    """Transform com.uvian.job.retry events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "com.uvian.job.retry"
    
    def create_message(self, event_data: Dict[str, Any], is_self_action: bool = False) -> EventMessage:
        resource_id = event_data.get("id", "unknown")
        
        message_content = f"""Event: com.uvian.job.retry
Resource: job/{resource_id}"""
        timestamp = event_data.get("createdAt") or event_data.get("updatedAt")
        if timestamp:
            message_content += f"\nEvent Time: {timestamp}"
        
        return EventMessage(
            content=message_content,
            event_type=self.event_type,
            metadata={
                "job_id": resource_id,
                "timestamp": timestamp,
                "is_self_action": is_self_action,
            }
        )


# Backwards compatibility aliases
JobCreatedTrigger = JobCreatedTransformer
JobCancelledTrigger = JobCancelledTransformer
JobRetryTrigger = JobRetryTransformer