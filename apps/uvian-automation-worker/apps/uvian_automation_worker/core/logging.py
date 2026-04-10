"""
Standardized logging configuration for the Uvian Worker system.

Uses structlog for structured logging with env-based output:
- development: ConsoleRenderer (pretty, colored)
- production: JSONRenderer (log aggregation)
"""
import logging
import os
import sys

import structlog
from structlog.dev import ConsoleRenderer
from structlog.processors import JSONRenderer
from structlog.processors import TimeStamper, add_log_level, format_exc_info
from structlog.stdlib import BoundLogger

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
ENV = os.environ.get("ENV", "development")


def configure_logging() -> structlog.BoundLogger:
    """Configure structlog based on environment."""
    is_production = ENV == "prod"
    
    processors = [
        add_log_level,
        TimeStamper(fmt="iso"),
        format_exc_info,
        JSONRenderer() if is_production else ConsoleRenderer(),
    ]
    
    structlog.configure(
        processors=processors,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        wrapper_class=BoundLogger,
        context_class=dict,
        cache_logger_on_first_use=True,
    )
    
    if is_production:
        for lib in ['httpx', 'httpcore', 'hpack', 'openai', 'urllib3']:
            logging.getLogger(lib).setLevel(logging.WARNING)
    
    return structlog.get_logger()


log = configure_logging()