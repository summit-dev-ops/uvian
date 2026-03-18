from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class TriggerMessage:
    """Message content to send to the agent for event triggers."""
    content: str
    event_type: str
    metadata: Dict[str, Any]


class BaseTrigger(ABC):
    """Base class for all event trigger handlers."""
    
    @abstractmethod
    def create_message(self, event_data: Dict[str, Any]) -> TriggerMessage:
        """
        Create a trigger message from event data.
        
        Args:
            event_data: The input data from the job (event payload)
            
        Returns:
            TriggerMessage with content and metadata for the agent
        """
        pass
    
    @property
    @abstractmethod
    def event_type(self) -> str:
        """The event type this trigger handles (e.g., 'message.created')."""
        pass


class TriggerRegistry:
    """Registry for mapping event types to trigger handlers."""
    
    _triggers: Dict[str, type[BaseTrigger]] = {}
    
    @classmethod
    def register(cls, event_type: str):
        """Decorator to register a trigger handler for an event type."""
        def decorator(trigger_class: type[BaseTrigger]):
            cls._triggers[event_type] = trigger_class
            return trigger_class
        return decorator
    
    @classmethod
    def get_trigger(cls, event_type: str) -> Optional[type[BaseTrigger]]:
        """Get the trigger class for an event type."""
        return cls._triggers.get(event_type)
    
    @classmethod
    def create_message(cls, event_type: str, event_data: Dict[str, Any]) -> Optional[TriggerMessage]:
        """Create a trigger message for an event type."""
        trigger_class = cls.get_trigger(event_type)
        if not trigger_class:
            return None
        trigger = trigger_class()
        return trigger.create_message(event_data)
    
    @classmethod
    def list_registered(cls) -> list[str]:
        """List all registered event types."""
        return list(cls._triggers.keys())
