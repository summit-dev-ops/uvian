# core/utils/naming.py
"""
Utilities for consistent parameter naming.
- API uses camelCase (agentProfileId, resourceScopeId)
- Database uses snake_case (agent_profile_id, resource_scope_id)
"""
import re
from typing import Any, Dict

def camel_to_snake(camel_str: str) -> str:
    """Convert camelCase to snake_case."""
    # Add underscore before capital letters (except first character)
    snake = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', camel_str)
    # Add underscore before capital letters followed by lowercase
    snake = re.sub('([a-z0-9])([A-Z])', r'\1_\2', snake)
    return snake.lower()

def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    # Split on underscore and capitalize first letter of each part (except first)
    parts = snake_str.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

def convert_keys_to_snake(data: Any) -> Any:
    """Convert all keys in a dictionary from camelCase to snake_case."""
    if not isinstance(data, dict):
        return data
    
    snake_data = {}
    for key, value in data.items():
        snake_key = camel_to_snake(str(key))
        
        # Recursively convert nested objects
        if isinstance(value, dict):
            snake_data[snake_key] = convert_keys_to_snake(value)
        elif isinstance(value, list):
            snake_data[snake_key] = [
                convert_keys_to_snake(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            snake_data[snake_key] = value
    
    return snake_data

def convert_keys_to_camel(data: Any) -> Any:
    """Convert all keys in a dictionary from snake_case to camelCase."""
    if not isinstance(data, dict):
        return data
    
    camel_data = {}
    for key, value in data.items():
        camel_key = snake_to_camel(str(key))
        
        # Recursively convert nested objects
        if isinstance(value, dict):
            camel_data[camel_key] = convert_keys_to_camel(value)
        elif isinstance(value, list):
            camel_data[camel_key] = [
                convert_keys_to_camel(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            camel_data[camel_key] = value
    
    return camel_data

# Database field mappings for common entity types
DB_FIELD_MAPPINGS = {
    # Backward compatibility - keep agent_threads mapping
    'agent_threads': {
        'id': 'id',
        'agentProfileId': 'profile_id',
        'resourceScopeId': 'resource_scope_id',
        'currentStatus': 'current_status',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
    },
    'agent_checkpoints': {
        'id': 'id',
        'threadId': 'thread_id',
        'checkpointId': 'checkpoint_id',
        'checkpointData': 'checkpoint_data',
        'createdAt': 'created_at'
    },
    'tickets': {
        'id': 'id',
        'threadId': 'thread_id',
        'resourceScopeId': 'resource_scope_id',
        'requesterJobId': 'requester_job_id',
        'status': 'status',
        'priority': 'priority',
        'title': 'title',
        'description': 'description',
        'resolutionPayload': 'resolution_payload',
        'assignedTo': 'assigned_to',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'resolvedAt': 'resolved_at'
    }
}

def to_db_format(entity_type: str, data: Any) -> Any:
    """Convert API data to database format using entity-specific mappings."""
    if not isinstance(data, dict):
        return data
        
    if entity_type not in DB_FIELD_MAPPINGS:
        # Fallback to general camelCase to snake_case conversion
        return convert_keys_to_snake(data)
    
    db_data = {}
    mapping = DB_FIELD_MAPPINGS[entity_type]
    
    for api_key, value in data.items():
        db_key = mapping.get(api_key, camel_to_snake(str(api_key)))
        db_data[db_key] = value
    
    return db_data

def from_db_format(entity_type: str, data: Any) -> Any:
    """Convert database data to API format using entity-specific mappings."""
    if not isinstance(data, dict):
        return data
        
    if entity_type not in DB_FIELD_MAPPINGS:
        # Fallback to general snake_case to camelCase conversion
        return convert_keys_to_camel(data)
    
    api_data = {}
    mapping = DB_FIELD_MAPPINGS[entity_type]
    
    # Create reverse mapping
    reverse_mapping = {v: k for k, v in mapping.items()}
    
    for db_key, value in data.items():
        api_key = reverse_mapping.get(db_key, snake_to_camel(str(db_key)))
        api_data[api_key] = value
    
    return api_data