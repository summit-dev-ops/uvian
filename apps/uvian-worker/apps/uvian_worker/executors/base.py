from abc import ABC, abstractmethod

class BaseExecutor(ABC):
    @abstractmethod
    async def execute(self, job_data: dict):
        """
        Execute the job logic.
        :param job_data: The full job dictionary from the database.
        :return: The result of the execution (to be stored in 'output').
        """
        pass
