"""
Dependency Injection Architecture for Uvian Worker System.

This module provides clean dependency injection patterns to eliminate
circular imports and improve testability across the worker system.
"""
from typing import Dict, Type, Optional, Any, Callable, List, Union
import threading
from .logging import worker_logger


class ServiceDescriptor:
    """Descriptor for service registration in the DI container."""
    
    def __init__(
        self, 
        implementation: Type,
        singleton: bool = True,
        factory_func: Optional[Callable] = None
    ):
        self.implementation = implementation
        self.singleton = singleton
        self.factory_func = factory_func
        self.instance: Optional[Any] = None


class DependencyContainer:
    """
    Dependency Injection Container for clean service management.

    Provides registration, resolution, and lifecycle management
    for all worker services and executors.
    """

    def __init__(self):
        self._services: Dict[str, ServiceDescriptor] = {}
        self._singletons: Dict[str, Any] = {}
        self._singleton_lock = threading.RLock()
    
    def register_service(
        self, 
        service_name: str,
        implementation: Type,
        singleton: bool = True,
        factory_func: Optional[Callable] = None
    ) -> None:
        """
        Register a service with the container.
        
        Args:
            service_name: Unique identifier for the service
            implementation: Class or function that implements the service
            singleton: If True, reuse the same instance (default: True)
            factory_func: Optional factory function for complex initialization
        """
        self._services[service_name] = ServiceDescriptor(
            implementation=implementation,
            singleton=singleton,
            factory_func=factory_func
        )
    
    def get_service(self, service_name: str) -> Any:
        """
        Resolve a service from the container.
        
        Args:
            service_name: Name of the service to resolve
            
        Returns:
            Service instance
            
        Raises:
            ValueError: If service is not registered
            Exception: If service resolution fails
        """
        if service_name not in self._services:
            raise ValueError(f"Service '{service_name}' is not registered")
        
        descriptor = self._services[service_name]
        
        # Thread-safe singleton creation
        with self._singleton_lock:
            # Double-checked locking pattern for thread safety
            if descriptor.singleton and service_name in self._singletons:
                return self._singletons[service_name]

            # Create new instance
            try:
                if descriptor.factory_func:
                    # Use factory function for complex initialization
                    instance = descriptor.factory_func()
                else:
                    # Simple instantiation
                    instance = descriptor.implementation()

                # Cache singleton instances
                if descriptor.singleton:
                    self._singletons[service_name] = instance

                return instance

            except Exception as e:
                raise Exception(f"Failed to resolve service '{service_name}': {e}")
    
    def register_executor(self, job_type: str, executor_class: Union[Type, Any]) -> None:
        """
        Register an executor class for a specific job type.
        
        Args:
            job_type: The job type this executor handles
            executor_class: The executor class to register
        """
        self.register_service(
            service_name=f"executor_{job_type}",
            implementation=executor_class,
            singleton=True
        )
    
    def get_executor(self, job_type: str) -> Any:
        """
        Get an executor for a specific job type.
        
        Args:
            job_type: The job type to get executor for
            
        Returns:
            Executor instance
            
        Raises:
            ValueError: If no executor is registered for the job type
        """
        service_name = f"executor_{job_type}"
        return self.get_service(service_name)
    
    def is_service_registered(self, service_name: str) -> bool:
        """Check if a service is registered."""
        return service_name in self._services
    
    def clear_singletons(self) -> None:
        """Clear all cached singleton instances (useful for testing)."""
        self._singletons.clear()


class ExecutorFactory:
    """
    Factory for creating and managing executor instances.
    
    Provides a clean interface for executor lifecycle management
    without circular imports or runtime complexity.
    """
    
    def __init__(self, container: DependencyContainer):
        self.container = container
        self._executor_cache: Dict[str, Any] = {}
    
    def register_executor(self, job_type: str, executor_class: Union[Type, Any]) -> None:
        """
        Register an executor class for a job type.
        
        Args:
            job_type: Job type this executor handles
            executor_class: Executor class to register
        """
        self.container.register_executor(job_type, executor_class)
    
    def get_executor(self, job_type: str) -> Any:
        """
        Get an executor for a job type.
        
        Args:
            job_type: Type of job to get executor for
            
        Returns:
            Executor instance
            
        Raises:
            ValueError: If no executor is registered for the job type
        """
        if job_type not in self._executor_cache:
            executor = self.container.get_executor(job_type)
            self._executor_cache[job_type] = executor
        
        return self._executor_cache[job_type]
    
    def get_all_registered_executor_types(self) -> List[str]:
        """Get list of all registered executor types."""
        return [
            name.replace("executor_", "") 
            for name in self.container._services.keys() 
            if name.startswith("executor_")
        ]


# Global container instance for application-wide use
_app_container: Optional[DependencyContainer] = None
_app_factory: Optional[ExecutorFactory] = None


def get_application_container() -> DependencyContainer:
    """Get the global application container (singleton)."""
    global _app_container
    if _app_container is None:
        _app_container = DependencyContainer()
    return _app_container


def get_executor_factory() -> ExecutorFactory:
    """Get the global executor factory (singleton)."""
    global _app_factory
    if _app_factory is None:
        container = get_application_container()
        _app_factory = ExecutorFactory(container)
    return _app_factory


def setup_default_executors() -> None:
    """
    Set up the default executors in the application container.
    
    This function registers the standard executors that come with the system.
    Call this during application startup to initialize the DI container.
    """
    factory = get_executor_factory()
    
    # Register default executors (lazy imported to avoid circular imports)
    try:
        from executors.chat_executor import ChatExecutor

        factory.register_executor("chat", ChatExecutor)
        worker_logger.info("Successfully registered chat executor")
        
        # Try to register agent executor, but don't fail if it's broken
        try:
            from executors.agent_executor import AgentExecutor
            factory.register_executor("agent", AgentExecutor)
            worker_logger.info("Successfully registered agent executor")
        except Exception as agent_error:
            worker_logger.warning(f"Agent executor registration failed (non-critical): {agent_error}")
            # Continue without agent executor for now
            
    except ImportError as e:
        worker_logger.error(f"Failed to import core executors: {e}")
        raise ImportError(f"Required executor modules not found: {e}")
    except Exception as e:
        worker_logger.error(f"Unexpected error during executor registration: {e}")
        raise


def create_test_container() -> DependencyContainer:
    """
    Create a fresh dependency container for testing.
    
    Returns:
        New dependency container with default executors registered
    """
    container = DependencyContainer()
    factory = ExecutorFactory(container)
    
    # Register default executors for testing (lazy imported)
    try:
        from ..executors.chat_executor import ChatExecutor
        from ..executors.agent_executor import AgentExecutor
        
        factory.register_executor("chat", ChatExecutor)
        factory.register_executor("agent", AgentExecutor)
    except ImportError:
        # For testing when executors are not available
        pass
    
    return container