import os

# Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# RunPod
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")

# Worker
WORKER_CONCURRENCY = 50
QUEUE_NAME = "main-queue"

# uvian API URLs
UVIAN_API_URL = os.getenv("UVIAN_API_URL", "http://localhost:3000")
UVIAN_AUTOMATION_API_URL = os.getenv("UVIAN_AUTOMATION_API_URL", "http://localhost:3001")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# MCP Configuration
UVIAN_MCP_LIST = os.getenv("UVIAN_MCP_LIST", "uvian-hub-mcp")  # comma-separated list
UVIAN_MCP_URL = os.getenv("UVIAN_MCP_URL", "http://localhost:3000/v1/mcp")
