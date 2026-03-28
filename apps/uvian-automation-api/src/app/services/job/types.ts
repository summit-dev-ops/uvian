import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateEventJobPayload {
  type: string;
  input: object;
}

export interface CreateJobPayload {
  type: string;
  input: object;
}

export interface ListJobsFilters {
  status?: string;
  type?: string;
}

export interface JobRecord {
  id: string;
  type: string;
  inputType: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  threadId: string | null;
  agentId: string | null;
}

export interface ListJobsResult {
  jobs: JobRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface JobScopedService {
  createEventJob(payload: CreateEventJobPayload): Promise<string>;
  createJob(
    payload: CreateJobPayload
  ): Promise<{ jobId: string; status: string }>;
  listJobs(filters?: ListJobsFilters): Promise<ListJobsResult>;
  getJobsForUser(filters?: ListJobsFilters): Promise<ListJobsResult>;
  getJob(jobId: string): Promise<JobRecord>;
  cancelJob(jobId: string): Promise<JobRecord>;
  retryJob(jobId: string): Promise<JobRecord>;
  deleteJob(jobId: string): Promise<{ success: boolean }>;
}

export interface JobAdminService {
  getById(jobId: string): Promise<JobRecord | null>;
}

export interface CreateJobServiceConfig {}
