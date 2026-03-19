import os

# Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_FAMILY = int(os.getenv("REDIS_FAMILY", 1))

# Worker
WORKER_CONCURRENCY = 50
QUEUE_NAME = "main-queue"

# uvian Automation API
UVIAN_AUTOMATION_API_URL = os.getenv("UVIAN_AUTOMATION_API_URL", "http://localhost:3001")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
