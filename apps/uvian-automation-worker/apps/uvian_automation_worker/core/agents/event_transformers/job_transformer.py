from typing import Dict, Any
from core.agents.event_transformers.base import (
    BaseEventTransformer,
    EventMessage,
    EventTransformerRegistry,
)


@EventTransformerRegistry.register("job.created")
class JobCreatedTransformer(BaseEventTransformer):
    """Transform job.created events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "job.created"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        actor_id = event_data.get("actorId", "unknown")
        actor_type = event_data.get("actorType", "system")
        resource_id = event_data.get("id", "unknown")
        
        job_type = event_data.get("jobType", "unknown")
        
        message_content = f"""Event: job.created
Actor: {actor_id} ({actor_type})
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
            }
        )


@EventTransformerRegistry.register("job.cancelled")
class JobCancelledTransformer(BaseEventTransformer):
    """Transform job.cancelled events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "job.cancelled"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        resource_id = event_data.get("id", "unknown")
        
        message_content = f"""Event: job.cancelled
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
            }
        )


@EventTransformerRegistry.register("job.retry")
class JobRetryTransformer(BaseEventTransformer):
    """Transform job.retry events into AI-readable messages."""
    
    @property
    def event_type(self) -> str:
        return "job.retry"
    
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        resource_id = event_data.get("id", "unknown")
        
        message_content = f"""Event: job.retry
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
            }
        )


# Backwards compatibility aliases
JobCreatedTrigger = JobCreatedTransformer
JobCancelledTrigger = JobCancelledTransformer
JobRetryTrigger = JobRetryTransformer