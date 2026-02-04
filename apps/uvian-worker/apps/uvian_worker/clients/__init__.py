"""
Database repository modules for Supabase operations.

This package provides domain-separated repository classes for different entities.
"""

from .supabase import supabase_client

__all__ = [
    'supabase_client'
]