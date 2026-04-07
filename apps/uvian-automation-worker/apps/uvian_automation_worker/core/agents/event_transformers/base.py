from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


def format_timestamp(ts: Optional[str]) -> Optional[str]:
    """Format a timestamp string for display. Returns ISO 8601 or None."""
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    except (ValueError, AttributeError):
        return ts


@dataclass
class EventMessage:
    """Message content to send to the agent for event transformers.
    
    Contains the AI-readable representation of an event plus metadata
    for context and processing.
    """
    content: str
    event_type: str
    metadata: Dict[str, Any]


class BaseEventTransformer(ABC):
    """Base class for all event-to-message transformers.
    
    Transforms incoming event data into AI-readable HumanMessage content
    that the agent can understand and respond to.
    """
    
    @abstractmethod
    def create_message(self, event_data: Dict[str, Any]) -> EventMessage:
        """Transform event data into an EventMessage.
        
        Args:
            event_data: The input data from the event (event payload)
            
        Returns:
            EventMessage with content and metadata for the agent
        """
        pass
    
    @property
    @abstractmethod
    def event_type(self) -> str:
        """The event type this transformer handles (e.g., 'message.created')."""
        pass


class EventTransformerRegistry:
    """Registry for mapping event types to event transformers."""
    
    _transformers: Dict[str, type[BaseEventTransformer]] = {}
    
    @classmethod
    def register(cls, event_type: str):
        """Decorator to register an event transformer for an event type."""
        def decorator(transformer_class: type[BaseEventTransformer]):
            cls._transformers[event_type] = transformer_class
            return transformer_class
        return decorator
    
    @classmethod
    def get_transformer(cls, event_type: str) -> Optional[type[BaseEventTransformer]]:
        """Get the transformer class for an event type."""
        return cls._transformers.get(event_type)
    
    @classmethod
    def create_message(cls, event_type: str, event_data: Dict[str, Any]) -> Optional[EventMessage]:
        """Create an event message for an event type."""
        transformer_class = cls.get_transformer(event_type)
        if not transformer_class:
            return None
        transformer = transformer_class()
        return transformer.create_message(event_data)
    
    @classmethod
    def list_registered(cls) -> list[str]:
        """List all registered event types."""
        return list(cls._transformers.keys())