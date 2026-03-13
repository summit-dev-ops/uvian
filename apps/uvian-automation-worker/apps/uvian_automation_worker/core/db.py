# Database repository interface - replaces MockSupabaseClient
from clients.jobs import job_repository
from clients.messages import message_repository
from clients.conversations import conversation_repository

# Legacy interface for backward compatibility during migration
class DatabaseInterface:
    """Legacy database interface for backward compatibility."""
    
    def get_job(self, job_id: str):
        return job_repository.get_job(job_id)
    
    def update_job(self, job_id: str, updates: dict):
        return job_repository.update_job(job_id, updates)
    
    def insert_message(self, message_data: dict):
        return message_repository.insert_message(message_data)

# Re-export as 'db' to maintain compatibility with existing code
db = DatabaseInterface()