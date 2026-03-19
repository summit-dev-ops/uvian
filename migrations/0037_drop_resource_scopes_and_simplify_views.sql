-- Drop resource_scopes table
DROP TABLE IF EXISTS public.resource_scopes;

-- Recreate simplified views (no space/conversation scoping)
-- Jobs views: access via thread -> process_threads.user_id

CREATE OR REPLACE VIEW public.get_jobs_for_current_user AS
  SELECT j.*
  FROM core_automation.jobs j
  JOIN core_automation.process_threads t ON t.id = j.thread_id
  WHERE t.user_id = auth.uid();

CREATE OR REPLACE VIEW public.get_job_details AS
  SELECT
    j.id,
    j.type,
    j.status,
    j.input,
    j.output,
    j.error_message,
    j.thread_id,
    j.agent_id,
    j.input_type,
    j.created_at,
    j.updated_at,
    j.started_at,
    j.completed_at,
    t.user_id as owner_id,
    t.current_status as thread_status
  FROM core_automation.jobs j
  LEFT JOIN core_automation.process_threads t ON t.id = j.thread_id;

CREATE OR REPLACE VIEW public.get_tickets_for_current_user AS
  SELECT t.*
  FROM core_automation.tickets t
  WHERE t.assigned_to = auth.uid()
     OR t.thread_id IN (
       SELECT id FROM core_automation.process_threads WHERE user_id = auth.uid()
     );

-- Drop views that depended on scoping
DROP VIEW IF EXISTS public.get_jobs_for_space;
DROP VIEW IF EXISTS public.get_jobs_for_conversation;
DROP VIEW IF EXISTS public.get_tickets_for_space;
DROP VIEW IF EXISTS public.get_jobs_metrics_for_space;
