import uuid

class MockSupabaseClient:
    def __init__(self):
        # In-memory store for mocked jobs
        self.jobs = {}

    def get_job(self, job_id: str):
        """Mock fetching a job by ID."""
        if job_id in self.jobs:
            return self.jobs[job_id]
        
        # fallback for testing if ID not found (simulate a default chat job)
        return {
            "id": job_id,
            "type": "chat",
            "status": "queued",
            "input": {
                "conversationId": "mock-conv-123",
                "messageId": str(uuid.uuid4()),
                "messages": [{"role": "user", "content": "Hello, mocked world!"}]
            },
            "output": None
        }

    def update_job(self, job_id: str, updates: dict):
        """Mock updating a job."""
        if job_id not in self.jobs:
            self.jobs[job_id] = {}
        self.jobs[job_id].update(updates)
        print(f"[MockDB] Updated Job {job_id}: {updates}", flush=True)
        return self.jobs[job_id]

# Singleton instance
db = MockSupabaseClient()
