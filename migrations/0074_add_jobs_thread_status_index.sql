-- Index for thread-level locking: fast lookup of active jobs by threadId
-- Used by webhook-handler to prevent duplicate jobs for same thread

CREATE INDEX IF NOT EXISTS idx_jobs_thread_status 
ON core_automation.jobs((input->>'threadId'), status)
WHERE status IN ('queued', 'pending', 'processing');