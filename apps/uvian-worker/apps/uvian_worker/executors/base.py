from abc import ABC, abstractmethod
from typing import TypedDict, Optional, Any, Union, Dict
from datetime import datetime

class JobData(TypedDict):
    """Type definition for job input data from the database."""
    id: str
    type: str
    input: Dict[str, Any]
    status: Optional[str]
    resource_scope_id: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class JobResult(TypedDict):
    """Type definition for job execution result."""
    status: str
    result: Dict[str, Any]

class JobExecutionError(TypedDict):
    """Type definition for job execution error information."""
    error: str
    context: Optional[Dict[str, Any]]

class BaseExecutor(ABC):
    """Base abstract class for all job executors with comprehensive type safety."""
    
    @abstractmethod
    async def execute(self, job_data: JobData) -> JobResult:
        """
        Execute the job logic with full type safety.
        
        :param job_data: The complete job dictionary from the database with proper typing
        :return: JobResult containing execution status and result data
        """
        pass
