"""
Standardized logging configuration for the Uvian Worker system.

This module provides consistent logging across all worker components
with proper formatting, levels, and structured output.
"""
import json
import logging
import os
import sys
from typing import Any, Optional
from datetime import datetime

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()


def setup_worker_logging(
    level: str = LOG_LEVEL,
    format_string: Optional[str] = None
) -> logging.Logger:
    """
    Set up standardized logging for the worker system.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string: Custom format string, uses default if None
        
    Returns:
        Configured logger instance
    """
    if format_string is None:
        format_string = (
            '%(asctime)s - %(name)s - %(levelname)s - '
            '[%(filename)s:%(lineno)d] - %(message)s'
        )
    
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(getattr(logging, level.upper()))
        handler.setFormatter(logging.Formatter(format_string))
        root_logger.addHandler(handler)
    
    worker_logger = logging.getLogger('uvian.automation_worker')
    worker_logger.setLevel(getattr(logging, level.upper()))
    
    return worker_logger

class WorkerLogger:
    """
    Structured logger for worker operations with job context.
    """
    
    def __init__(self, name: str = "uvian.automation_worker"):
        self.logger = logging.getLogger(name)
        self.name = name
    
    def info_job(self, job_id: str, message: str, **kwargs) -> None:
        """Log info message with job context."""
        context = f"[{job_id}]"
        full_message = f"{context} {message}"
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.info(full_message)
    
    def error_job(self, job_id: str, message: str, exception: Optional[Exception] = None, **kwargs) -> None:
        """Log error message with job context."""
        context = f"[{job_id}]"
        full_message = f"{context} {message}"
        if kwargs:
            full_message += f" - {kwargs}"
        if exception:
            full_message += f" - Exception: {type(exception).__name__}: {str(exception)}"
        self.logger.error(full_message)
    
    def debug_job(self, job_id: str, message: str, **kwargs) -> None:
        """Log debug message with job context."""
        context = f"[{job_id}]"
        full_message = f"{context} {message}"
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.debug(full_message)
    
    def warning_job(self, job_id: str, message: str, **kwargs) -> None:
        """Log warning message with job context."""
        context = f"[{job_id}]"
        full_message = f"{context} {message}"
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.warning(full_message)
    
    # Standard logging methods for non-job-specific messages
    def info(self, message: str, **kwargs) -> None:
        """Standard info logging."""
        full_message = message
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.info(full_message)
    
    def error(self, message: str, exception: Optional[Exception] = None, **kwargs) -> None:
        """Standard error logging."""
        full_message = message
        if exception:
            full_message += f" - Exception: {type(exception).__name__}: {str(exception)}"
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.error(full_message)
    
    def debug(self, message: str, **kwargs) -> None:
        """Standard debug logging."""
        full_message = message
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.debug(full_message)
    
    def warning(self, message: str, **kwargs) -> None:
        """Standard warning logging."""
        full_message = message
        if kwargs:
            full_message += f" - {kwargs}"
        self.logger.warning(full_message)

    def log_structured(
        self,
        level: str,
        message: str,
        thread_id: Optional[str] = None,
        agent_user_id: Optional[str] = None,
        llm_calls: Optional[int] = None,
        event_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        inbox_messages_added: Optional[int] = None,
        node: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Log structured JSON with agent context fields."""
        log_data = {
            "message": message,
        }
        if thread_id:
            log_data["thread_id"] = thread_id
        if agent_user_id:
            log_data["agent_user_id"] = agent_user_id
        if llm_calls is not None:
            log_data["llm_calls"] = llm_calls
        if event_type:
            log_data["event_type"] = event_type
        if conversation_id:
            log_data["conversation_id"] = conversation_id
        if inbox_messages_added is not None:
            log_data["inbox_messages_added"] = inbox_messages_added
        if node:
            log_data["node"] = node
        if extra:
            log_data.update(extra)

        json_message = json.dumps(log_data)

        log_func = getattr(self.logger, level.lower(), self.logger.info)
        log_func(json_message)

    def info_agent(
        self,
        message: str,
        thread_id: Optional[str] = None,
        agent_user_id: Optional[str] = None,
        llm_calls: Optional[int] = None,
        event_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        inbox_messages_added: Optional[int] = None,
        node: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Log INFO level structured message with agent context."""
        self.log_structured(
            "INFO",
            message,
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            event_type=event_type,
            conversation_id=conversation_id,
            inbox_messages_added=inbox_messages_added,
            node=node,
            extra=extra,
        )

    def debug_agent(
        self,
        message: str,
        thread_id: Optional[str] = None,
        agent_user_id: Optional[str] = None,
        llm_calls: Optional[int] = None,
        event_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        inbox_messages_added: Optional[int] = None,
        node: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Log DEBUG level structured message with agent context."""
        self.log_structured(
            "DEBUG",
            message,
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            event_type=event_type,
            conversation_id=conversation_id,
            inbox_messages_added=inbox_messages_added,
            node=node,
            extra=extra,
        )

    def warning_agent(
        self,
        message: str,
        thread_id: Optional[str] = None,
        agent_user_id: Optional[str] = None,
        llm_calls: Optional[int] = None,
        event_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        inbox_messages_added: Optional[int] = None,
        node: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Log WARNING level structured message with agent context."""
        self.log_structured(
            "WARNING",
            message,
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            event_type=event_type,
            conversation_id=conversation_id,
            inbox_messages_added=inbox_messages_added,
            node=node,
            extra=extra,
        )

    def error_agent(
        self,
        message: str,
        thread_id: Optional[str] = None,
        agent_user_id: Optional[str] = None,
        llm_calls: Optional[int] = None,
        event_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        inbox_messages_added: Optional[int] = None,
        node: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> None:
        """Log ERROR level structured message with agent context."""
        self.log_structured(
            "ERROR",
            message,
            thread_id=thread_id,
            agent_user_id=agent_user_id,
            llm_calls=llm_calls,
            event_type=event_type,
            conversation_id=conversation_id,
            inbox_messages_added=inbox_messages_added,
            node=node,
            extra=extra,
        )

# Global logger instance
worker_logger = WorkerLogger()

# Convenience functions for backward compatibility with existing code
def log_job_info(job_id: str, message: str, **kwargs) -> None:
    """Log info message with job context."""
    worker_logger.info_job(job_id, message, **kwargs)

def log_job_error(job_id: str, message: str, exception: Optional[Exception] = None, **kwargs) -> None:
    """Log error message with job context."""
    worker_logger.error_job(job_id, message, exception, **kwargs)

def log_job_debug(job_id: str, message: str, **kwargs) -> None:
    """Log debug message with job context."""
    worker_logger.debug_job(job_id, message, **kwargs)

def log_job_warning(job_id: str, message: str, **kwargs) -> None:
    """Log warning message with job context."""
    worker_logger.warning_job(job_id, message, **kwargs)