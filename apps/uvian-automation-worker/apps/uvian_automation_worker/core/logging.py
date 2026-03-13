"""
Standardized logging configuration for the Uvian Worker system.

This module provides consistent logging across all worker components
with proper formatting, levels, and structured output.
"""
import logging
import sys
from typing import Optional
from datetime import datetime

# Configure the main worker logger
def setup_worker_logging(level: str = "INFO", format_string: Optional[str] = None) -> logging.Logger:
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
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=format_string,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.StreamHandler(sys.stderr)
        ]
    )
    
    # Create worker-specific logger
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