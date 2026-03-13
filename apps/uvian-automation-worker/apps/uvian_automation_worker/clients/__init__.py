"""
Database repository modules for Supabase operations.

This package provides domain-separated repository classes for different entities.
"""

from .supabase import supabase_client
from .mcp import create_mcp_registry
from .auth import get_agent_api_key, exchange_for_jwt

__all__ = [
    'supabase_client',
    'create_mcp_registry',
    'get_agent_api_key',
    'exchange_for_jwt'
]