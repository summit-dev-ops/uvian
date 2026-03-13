"""Repository exports for dependency injection and module access."""

from .jobs import job_repository, JobRepository
from .checkpoints import checkpoint_repository, CheckpointRepository
from .profiles import profile_repository, ProfileRepository

# Repository registry for dependency injection
REPOSITORY_REGISTRY = {
    'job': job_repository,
    'checkpoints': checkpoint_repository,
    'profiles': profile_repository
}

def get_repository(name: str):
    """Get repository by name for dependency injection."""
    return REPOSITORY_REGISTRY.get(name)

# Type-safe repository access
class RepositoryFactory:
    """Factory for type-safe repository access."""

    @staticmethod
    def get_job_repository() -> JobRepository:
        return job_repository

    @staticmethod
    def get_checkpoints_repository() -> CheckpointRepository:
        return checkpoint_repository

    @staticmethod
    def get_profile_repository() -> ProfileRepository:
        return profile_repository
