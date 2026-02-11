# Uvian Worker - Agent Guidelines

This document provides specific guidelines for AI coding agents working on the **uvian-worker** Python background processing service.

## 🏗️ Application Overview

- **Technology**: Python 3.11+, Poetry, BullMQ, asyncio
- **Architecture**: Repository + Executor patterns with event-driven design
- **Database**: Supabase (PostgreSQL)
- **Job Queue**: BullMQ with Redis
- **AI Integration**: RunPod client for model inference
- **Real-time**: Redis pub/sub for inter-service communication

---

## 🚀 Development Commands

### **Core Commands**

```bash
# Start worker
nx serve uvian-worker

# Or use specific start command
nx start-worker uvian-worker

# Build worker
nx build uvian-worker

# Install dependencies
nx install uvian-worker

# Run tests
nx test uvian-worker

# Lint with flake8
nx lint uvian-worker
```

### **Poetry Commands**

```bash
# Install dependencies
poetry install --with dev

# Install specific dependency
poetry add httpx aioredis

# Install development dependency
poetry add --group dev pytest pytest-cov

# Run Python tests with Poetry
poetry run pytest tests/

# Run with coverage
poetry run pytest --cov=apps.uvian_worker --cov-report=html

# Enter Poetry shell
poetry shell

# Run specific script
poetry run python apps/uvian_worker/main.py
```

### **Testing Commands**

```bash
# Run all tests
nx test uvian-worker

# Run specific test file
nx test uvian-worker --testPathPattern=test_hello

# Run with coverage
poetry run pytest --cov=apps.uvian_worker tests/

# Run with verbose output
poetry run pytest -v tests/
```

---

## 🏗️ Architecture Guidelines

### **Repository Pattern**

Always use the repository pattern for database access:

#### **Repository Structure**

```
repositories/
├── jobs.py              # Job repository
├── conversations.py     # Conversation repository
└── messages.py          # Message repository
```

#### **Repository Implementation Pattern**

```python
# ✅ Correct repository pattern
from typing import List, Optional, Dict, Any
from datetime import datetime

class JobRepository:
    def __init__(self, supabase_client):
        self.client = supabase_client

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve job by ID"""
        response = (
            self.client.table("jobs")
            .select("*")
            .eq("id", job_id)
            .execute()
        )
        return response.data[0] if response.data else None

    async def update_job_status(
        self,
        job_id: str,
        status: str,
        output: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update job status with proper error handling"""
        try:
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat(),
            }

            if status == "processing":
                update_data["started_at"] = datetime.utcnow().isoformat()
            elif status in ["completed", "failed"]:
                update_data["completed_at"] = datetime.utcnow().isoformat()
                update_data["output"] = output or {}

            response = (
                self.client.table("jobs")
                .update(update_data)
                .eq("id", job_id)
                .execute()
            )

            return len(response.data) > 0 if response.data else False
        except Exception as error:
            # Log error and re-raise with context
            raise JobRepositoryError(
                f"Failed to update job {job_id}: {error}"
            ) from error
```

### **Executor Pattern**

Use the executor pattern for job processing:

#### **Executor Structure**

```
executors/
├── base.py              # Abstract base executor
└── chat_executor.py     # Chat-specific executor
```

#### **Executor Implementation Pattern**

```python
# ✅ Base executor interface
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseExecutor(ABC):
    @abstractmethod
    async def execute(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Execute job and return result"""
        pass

    async def before_execution(self, job: Dict[str, Any]) -> None:
        """Hook called before execution"""
        pass

    async def after_execution(self, job: Dict[str, Any], result: Dict[str, Any]) -> None:
        """Hook called after successful execution"""
        pass

    async def on_error(self, job: Dict[str, Any], error: Exception) -> None:
        """Hook called on execution error"""
        pass

# ✅ Chat executor implementation
class ChatExecutor(BaseExecutor):
    def __init__(
        self,
        runpod_client: RunPodClient,
        conversation_repo: ConversationRepository,
        message_repo: MessageRepository,
        job_repo: JobRepository,
        event_publisher: EventPublisher
    ):
        self.runpod_client = runpod_client
        self.conversation_repo = conversation_repo
        self.message_repo = message_repo
        self.job_repo = job_repo
        self.event_publisher = event_publisher

    async def execute(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Execute AI chat job with comprehensive error handling"""
        job_id = job["jobId"]
        input_data = job["input"]

        try:
            await self.before_execution(job)

            # Update job status to processing
            await self.job_repo.update_job_status(job_id, "processing")

            # Get conversation context
            conversation = await self.conversation_repo.get_conversation(
                input_data["conversationId"]
            )
            if not conversation:
                raise ChatExecutorError(f"Conversation not found: {input_data['conversationId']}")

            # Get recent messages for context
            messages = await self.message_repo.get_conversation_messages(
                input_data["conversationId"], limit=20
            )

            # Prepare AI prompt
            ai_messages = self._prepare_ai_prompt(conversation, messages, input_data)

            # Call RunPod for AI response
            response_content = ""
            async for token in self.runpod_client.chat_completion(ai_messages):
                response_content += token

            # Save AI response message
            ai_message = await self.message_repo.create_message({
                "conversation_id": input_data["conversationId"],
                "content": response_content,
                "sender_id": "ai_assistant",
                "type": "ai",
                "reply_to_id": input_data.get("messageId"),
                "metadata": {
                    "model": "llama-2-70b",
                    "tokens_used": len(response_content.split()),
                    "job_id": job_id
                }
            })

            # Publish event
            await self.event_publisher.publish_message(
                channel=f"conversation:{input_data['conversationId']}:messages",
                data={
                    "type": "ai_response",
                    "messageId": ai_message.id,
                    "content": response_content,
                    "timestamp": ai_message.created_at
                }
            )

            result = {
                "status": "completed",
                "messageId": ai_message.id,
                "content": response_content,
                "model": "llama-2-70b"
            }

            await self.after_execution(job, result)
            return result

        except Exception as error:
            await self.on_error(job, error)
            await self.job_repo.update_job_status(
                job_id,
                "failed",
                {"error": str(error), "error_type": type(error).__name__}
            )
            raise
```

---

## 💻 Python Code Style Guidelines

### **Import Organization**

```python
# ✅ Standard import order
import asyncio
import json
from datetime import datetime
from typing import List, Optional, Dict, Any, AsyncGenerator

# Third-party imports
import aioredis
import httpx
from supabase import create_client

# Local imports
from ..core.config import Settings
from ..repositories.jobs import JobRepository
from ..clients.runpod import RunPodClient
```

### **Type Hints**

```python
# ✅ Use comprehensive type hints
from typing import List, Optional, Dict, Any, Union, Callable
from datetime import datetime

# Function type hints
async def process_job(
    job_id: str,
    job_data: Dict[str, Any],
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Process a background job with proper type hints"""
    pass

# Class type hints
class JobProcessor:
    def __init__(
        self,
        redis_client: aioredis.Redis,
        job_repository: JobRepository,
        executor_registry: Dict[str, BaseExecutor]
    ) -> None:
        self.redis = redis_client
        self.job_repository = job_repository
        self.executor_registry = executor_registry

    async def process_job(self, job_id: str) -> Dict[str, Any]:
        """Process a single job"""
        pass
```

### **Error Handling**

```python
# ✅ Custom exception classes
class WorkerError(Exception):
    """Base exception for worker errors"""
    pass

class JobProcessorError(WorkerError):
    """Job processing specific errors"""
    pass

class RepositoryError(WorkerError):
    """Repository operation errors"""
    pass

class ExecutorError(WorkerError):
    """Executor execution errors"""
    pass

# ✅ Proper error handling pattern
async def process_job_safely(job: Dict[str, Any]) -> Dict[str, Any]:
    """Process job with comprehensive error handling"""
    job_id = job.get("jobId", "unknown")

    try:
        # Validate job data
        if not job_id or not job.get("input"):
            raise JobProcessorError(f"Invalid job data: {job}")

        # Process job with timeout
        async with asyncio.timeout(300):  # 5-minute timeout
            result = await actual_job_processing(job)

        return result

    except asyncio.TimeoutError:
        error_msg = f"Job {job_id} timed out after 5 minutes"
        logger.error(error_msg)
        await update_job_status(job_id, "failed", {"error": error_msg})
        raise JobProcessorError(error_msg)

    except Exception as error:
        error_msg = f"Job {job_id} failed: {str(error)}"
        logger.error(f"Job processing error: {error}", exc_info=True)
        await update_job_status(job_id, "failed", {
            "error": str(error),
            "error_type": type(error).__name__
        })
        raise
```

---

## 📊 Database Patterns

### **Supabase Client Usage**

```python
# ✅ Proper Supabase client setup
from supabase import create_client, Client
from typing import Optional

class SupabaseClient:
    _instance: Optional[Client] = None

    @classmethod
    def get_instance(cls) -> Client:
        """Get or create singleton Supabase client"""
        if not cls._instance:
            cls._instance = create_client(
                Settings.supabase_url,
                Settings.supabase_service_role_key
            )
        return cls._instance

# ✅ Async database operations
async def get_conversation_with_members(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get conversation with all members in a single query"""
    client = SupabaseClient.get_instance()

    try:
        response = (
            client.table("conversations")
            .select(`
                *,
                conversation_members(
                    role,
                    joined_at,
                    profiles(
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq("id", conversation_id)
            .single()
            .execute()
        )
        return response.data
    except Exception as error:
        logger.error(f"Failed to get conversation {conversation_id}: {error}")
        raise RepositoryError(f"Conversation fetch failed: {error}")
```

### **Transaction Patterns**

```python
# ✅ Atomic operations
async def create_conversation_with_members(
    conversation_data: Dict[str, Any],
    member_data: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Create conversation and add members atomically"""
    client = SupabaseClient.get_instance()

    try:
        # Start transaction
        with client.transaction():
            # Create conversation
            conversation_response = (
                client.table("conversations")
                .insert(conversation_data)
                .select()
                .single()
                .execute()
            )

            if not conversation_response.data:
                raise RepositoryError("Failed to create conversation")

            conversation_id = conversation_response.data["id"]

            # Add members
            members_with_conversation = [
                {**member, "conversation_id": conversation_id}
                for member in member_data
            ]

            members_response = (
                client.table("conversation_members")
                .insert(members_with_conversation)
                .execute()
            )

            if not members_response.data:
                raise RepositoryError("Failed to add conversation members")

            return conversation_response.data

    except Exception as error:
        logger.error(f"Failed to create conversation: {error}")
        raise
```

---

## 🤖 AI Integration Patterns

### **RunPod Client**

```python
# ✅ Robust AI client implementation
import asyncio
import httpx
from typing import AsyncGenerator, Dict, Any

class RunPodClient:
    def __init__(self, api_key: str, endpoint_id: str):
        self.api_key = api_key
        self.endpoint_id = endpoint_id
        self.base_url = f"https://api.runpod.ai/v2/{endpoint_id}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-2-70b",
        max_tokens: int = 1000,
        temperature: float = 0.7,
        timeout: float = 60.0
    ) -> AsyncGenerator[str, None]:
        """Generate streaming AI responses with retry logic"""
        payload = {
            "input": {
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": True
            },
            "model": model
        }

        for attempt in range(3):  # Retry up to 3 times
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/run",
                        json=payload,
                        headers=self.headers
                    ) as response:
                        response.raise_for_status()

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]  # Remove "data: " prefix
                                if data == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(data)
                                    if "choices" in chunk and chunk["choices"]:
                                        delta = chunk["choices"][0].get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                except json.JSONDecodeError:
                                    continue
                break  # Success, exit retry loop

            except httpx.TimeoutException:
                if attempt == 2:  # Last attempt
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

            except httpx.HTTPStatusError as error:
                if error.response.status_code >= 500:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 ** attempt)
                else:
                    raise  # Don't retry client errors
```

### **AI Prompt Engineering**

```python
# ✅ Structured AI prompt system
class AIPromptBuilder:
    @staticmethod
    def build_chat_prompt(
        conversation: Dict[str, Any],
        messages: List[Dict[str, Any]],
        user_message: str,
        system_context: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Build structured prompt for AI chat"""

        # Base system message
        system_prompt = system_context or f"""
        You are an AI assistant in a {conversation.get('type', 'conversation')}
        conversation titled "{conversation.get('name', 'Untitled')}".

        Guidelines:
        - Be helpful, concise, and engaging
        - Maintain conversation context
        - Provide accurate information
        - Ask clarifying questions when needed
        - Stay in character as an AI assistant
        """

        ai_messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Add conversation history (last 10 messages for context)
        for msg in messages[-10:]:
            role = "assistant" if msg.get("sender_id") == "ai_assistant" else "user"
            ai_messages.append({
                "role": role,
                "content": msg["content"]
            })

        # Add current user message
        ai_messages.append({
            "role": "user",
            "content": user_message
        })

        return ai_messages
```

---

## 🔄 Event System Patterns

### **Redis Pub/Sub**

```python
# ✅ Event publisher/subscriber pattern
import aioredis
import json
from typing import Callable, Dict, Any

class EventPublisher:
    def __init__(self, redis_pool: aioredis.Redis):
        self.redis = redis_pool

    async def publish_message(
        self,
        channel: str,
        data: Dict[str, Any],
        priority: str = "normal"
    ) -> int:
        """Publish message to Redis channel with error handling"""
        try:
            message = json.dumps(data, default=str)
            result = await self.redis.publish(channel, message)
            logger.debug(f"Published to {channel}: {len(data)} bytes")
            return result
        except Exception as error:
            logger.error(f"Failed to publish to {channel}: {error}")
            raise

class EventSubscriber:
    def __init__(self, redis_pool: aioredis.Redis):
        self.redis = redis_pool
        self.subscribers: Dict[str, Callable] = {}

    async def subscribe_to_channel(
        self,
        channel: str,
        callback: Callable[[str, Dict[str, Any]], None]
    ) -> None:
        """Subscribe to a Redis channel"""
        self.subscribers[channel] = callback
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)

        # Start listening in background
        asyncio.create_task(self._listen_to_channel(pubsub, channel))

    async def _listen_to_channel(self, pubsub: aioredis.Redis, channel: str):
        """Listen for messages on a specific channel"""
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        callback = self.subscribers.get(channel)
                        if callback:
                            await callback(channel, data)
                    except json.JSONDecodeError as error:
                        logger.error(f"Failed to parse message from {channel}: {error}")
                        logger.debug(f"Raw message: {message['data']}")
        except Exception as error:
            logger.error(f"Error listening to channel {channel}: {error}")
```

### **Event Types**

```python
# ✅ Standardized event structures
class EventTypes:
    # Message events
    MESSAGE_CREATED = "message_created"
    MESSAGE_UPDATED = "message_updated"
    AI_RESPONSE = "ai_response"

    # Job events
    JOB_QUEUED = "job_queued"
    JOB_STARTED = "job_started"
    JOB_COMPLETED = "job_completed"
    JOB_FAILED = "job_failed"

    # User events
    USER_ONLINE = "user_online"
    USER_OFFLINE = "user_offline"
    USER_TYPING = "user_typing"

# ✅ Event publishing helpers
async def publish_ai_response(
    publisher: EventPublisher,
    conversation_id: str,
    message_id: str,
    content: str,
    metadata: Dict[str, Any]
) -> None:
    """Publish AI response event"""
    await publisher.publish_message(
        channel=f"conversation:{conversation_id}:messages",
        data={
            "type": EventTypes.AI_RESPONSE,
            "messageId": message_id,
            "conversationId": conversation_id,
            "content": content,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def publish_job_completion(
    publisher: EventPublisher,
    job_id: str,
    status: str,
    output: Dict[str, Any]
) -> None:
    """Publish job completion event"""
    await publisher.publish_message(
        channel=f"job:{job_id}:status",
        data={
            "type": EventTypes.JOB_COMPLETED if status == "completed" else EventTypes.JOB_FAILED,
            "jobId": job_id,
            "status": status,
            "output": output,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
```

---

## 🧪 Testing Guidelines

### **Async Testing Patterns**

```python
# ✅ pytest with asyncio support
import pytest
from unittest.mock import Mock, AsyncMock
from apps.uvian_worker.executors.chat_executor import ChatExecutor
from apps.uvian_worker.repositories.jobs import JobRepository

@pytest.mark.asyncio
async def test_chat_executor_success():
    """Test successful chat job execution"""
    # Mock dependencies
    mock_runpod = Mock()
    mock_runpod.chat_completion = AsyncMock()
    mock_runpod.chat_completion.return_value = iter(["Hello", " world!"])

    mock_conversation_repo = Mock()
    mock_conversation_repo.get_conversation = AsyncMock()
    mock_conversation_repo.get_conversation.return_value = {
        "id": "conv_1",
        "type": "group",
        "name": "Test Conversation"
    }

    mock_message_repo = Mock()
    mock_message_repo.get_conversation_messages = AsyncMock()
    mock_message_repo.get_conversation_messages.return_value = []
    mock_message_repo.create_message = AsyncMock()
    mock_message_repo.create_message.return_value = Mock(
        id="msg_123",
        created_at=datetime.utcnow()
    )

    mock_job_repo = Mock()
    mock_job_repo.update_job_status = AsyncMock()

    mock_event_publisher = Mock()
    mock_event_publisher.publish_message = AsyncMock()

    # Create executor and test
    executor = ChatExecutor(
        runpod_client=mock_runpod,
        conversation_repo=mock_conversation_repo,
        message_repo=mock_message_repo,
        job_repo=mock_job_repo,
        event_publisher=mock_event_publisher
    )

    job_data = {
        "jobId": "job_123",
        "input": {
            "conversationId": "conv_1",
            "message": "Hello AI!",
            "userId": "user_1",
            "messageId": "msg_456"
        }
    }

    result = await executor.execute(job_data)

    # Verify results
    assert result["status"] == "completed"
    assert result["content"] == "Hello world!"
    assert result["messageId"] == "msg_123"

    # Verify method calls
    mock_conversation_repo.get_conversation.assert_called_once_with("conv_1")
    mock_message_repo.create_message.assert_called_once()
    mock_event_publisher.publish_message.assert_called_once()

@pytest.mark.asyncio
async def test_repository_error_handling():
    """Test repository error handling"""
    # Mock Supabase client that raises exception
    mock_client = Mock()
    mock_client.table.return_value.select.return_value.execute.side_effect = Exception("Database error")

    repo = JobRepository(mock_client)

    with pytest.raises(RepositoryError) as exc_info:
        await repo.get_job("job_123")

    assert "Failed to retrieve job job_123" in str(exc_info.value)
```

### **Integration Testing**

```python
# ✅ Full pipeline integration test
import pytest
from apps.uvian_worker.main import Worker
from apps.uvian_worker.core.config import Settings

@pytest.mark.asyncio
async def test_full_job_processing_pipeline():
    """Test complete job processing from API to worker"""
    # Create test worker instance
    worker = Worker(
        redis_url="redis://localhost:6379",
        supabase_url=Settings.supabase_url,
        supabase_key=Settings.supabase_service_role_key
    )

    await worker.start()

    try:
        # Submit a test job
        job_id = await worker.submit_job("ai-chat", {
            "conversationId": "test_conv_123",
            "message": "What is 2+2?",
            "userId": "test_user_456"
        })

        # Wait for job completion
        result = await worker.wait_for_job_completion(job_id, timeout=30)

        # Verify job completed successfully
        assert result["status"] == "completed"
        assert "output" in result
        assert "content" in result["output"]

    finally:
        await worker.stop()
```

---

## 🔧 Configuration Management

### **Environment Variables**

```python
# ✅ Pydantic-based configuration
from pydantic import BaseSettings, validator
from typing import Optional

class Settings(BaseSettings):
    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    redis_url: Optional[str] = None

    # Database Configuration
    supabase_url: str
    supabase_service_role_key: str

    # RunPod Configuration
    runpod_api_key: str
    runpod_endpoint_id: str
    runpod_endpoint_url: Optional[str] = None

    # Worker Configuration
    worker_concurrency: int = 5
    worker_poll_interval: float = 1.0
    worker_max_retries: int = 3
    worker_job_timeout: int = 300  # 5 minutes
    log_level: str = "INFO"

    # Derived properties
    @property
    def redis_connection_string(self) -> str:
        if self.redis_url:
            return self.redis_url
        auth = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}"

    @validator('worker_concurrency')
    def validate_concurrency(cls, v):
        if v < 1 or v > 50:
            raise ValueError('Worker concurrency must be between 1 and 50')
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
settings = Settings()
```

---

## 🚨 Common Issues & Solutions

### **Development Issues**

#### **Import Errors**

```python
# Check Python path and imports
import sys
print("Python path:", sys.path)
print("Current working directory:", os.getcwd())

# Ensure proper module structure
# apps/uvian_worker/
# ├── __init__.py
# ├── main.py
# └── ... (other modules)
```

#### **Async Event Loop Issues**

```python
# ✅ Proper async event loop handling
import asyncio

async def main():
    """Main async function"""
    try:
        # Worker setup and job processing
        worker = Worker()
        await worker.start()

        # Keep alive
        while True:
            await asyncio.sleep(1)

    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        await worker.stop()

if __name__ == "__main__":
    asyncio.run(main())
```

#### **Database Connection Issues**

```python
# ✅ Connection testing and retry logic
import asyncpg
from supabase import create_client

async def test_database_connection():
    """Test database connectivity"""
    try:
        # Test Supabase connection
        supabase = create_client(Settings.supabase_url, Settings.supabase_service_role_key)
        response = supabase.table('profiles').select('count').limit(1).execute()
        print("✅ Supabase connection successful")

        # Test direct PostgreSQL connection (if needed)
        conn = await asyncpg.connect(Settings.supabase_url)
        await conn.execute('SELECT 1')
        await conn.close()
        print("✅ Direct PostgreSQL connection successful")

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise

# Retry decorator for database operations
def retry_on_failure(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as error:
                    if attempt == max_attempts - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {error}")
                    await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
            return None
        return wrapper
    return decorator
```

### **Performance Issues**

#### **Memory Leaks**

```python
# ✅ Proper resource cleanup
import weakref
import gc

class ResourceTracker:
    def __init__(self):
        self._resources = weakref.WeakSet()

    def add(self, resource):
        self._resources.add(resource)

    def cleanup(self):
        """Clean up all tracked resources"""
        for resource in list(self._resources):
            if hasattr(resource, 'close'):
                try:
                    resource.close()
                except Exception as e:
                    logger.error(f"Error closing resource: {e}")

        # Force garbage collection
        gc.collect()

# Use in worker lifecycle
tracker = ResourceTracker()

async def worker_startup():
    # Create connections with tracking
    redis_pool = await aioredis.create_pool(settings.redis_connection_string)
    tracker.add(redis_pool)

    # Register cleanup
    atexit.register(lambda: asyncio.run(tracker.cleanup()))
```

#### **Slow Job Processing**

```python
# ✅ Performance monitoring and optimization
import time
from functools import wraps

def monitor_performance(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as error:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {error}")
            raise
    return wrapper

# Apply to job processing
@monitor_performance
async def process_job(job_id: str) -> Dict[str, Any]:
    """Process job with performance monitoring"""
    # Job processing logic here
    pass
```

---

## 📚 Resources

- **Main Application README**: [`../README.md`](../README.md)
- **Root Project README**: [`../../README.md`](../../README.md)
- **Poetry Documentation**: [https://python-poetry.org/docs](https://python-poetry.org/docs)
- **BullMQ Documentation**: [https://docs.bullmq.io](https://docs.bullmq.io)
- **Python asyncio**: [https://docs.python.org/3/library/asyncio.html](https://docs.python.org/3/library/asyncio.html)
- **pytest Documentation**: [https://docs.pytest.org](https://docs.pytest.org)

---

**Remember**: Always use type hints, proper error handling, and async/await patterns throughout the worker application.
