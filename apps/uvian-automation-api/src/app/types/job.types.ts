export type JobInputType = 'manual' | 'event' | 'scheduled' | 'webhook';

export interface BaseJobInput {
  inputType: JobInputType;
}

export interface ManualJobInput extends BaseJobInput {
  inputType: 'manual';
  message?: string;
}

export interface EventJobInput extends BaseJobInput {
  inputType: 'event';
  eventId: string;
  eventType: string;
  actor: {
    id: string;
    type: 'user' | 'system' | 'agent';
  };
  resource: {
    type: string;
    id: string;
    data: Record<string, any>;
  };
  context: {
    conversationId?: string;
    spaceId?: string;
  };
  agentId?: string;
  threadId?: string;
}

export interface ScheduledJobInput extends BaseJobInput {
  inputType: 'scheduled';
  scheduleId: string;
  cronExpression?: string;
}

export interface WebhookJobInput extends BaseJobInput {
  inputType: 'webhook';
  webhookId: string;
  source: string;
  payload: Record<string, any>;
}

export type JobInput =
  | ManualJobInput
  | EventJobInput
  | ScheduledJobInput
  | WebhookJobInput;

export interface Job {
  id: string;
  type: 'chat' | 'task' | 'agent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: JobInput;
  output: Record<string, any> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobFilters {
  status?: Job['status'];
  type?: Job['type'];
  dateFrom?: string;
  dateTo?: string;
  threadId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
}

export interface GetJobRequest {
  Params: {
    id: string;
  };
}
export interface CancelJobRequest {
  Params: {
    id: string;
  };
}
export interface RetryJobRequest {
  Params: {
    id: string;
  };
}
export interface DeleteJobRequest {
  Params: {
    id: string;
  };
}
export interface GetJobsUsageRequest {
  Querystring: {
    status?: Job['status'];
    type?: Job['type'];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
}

export interface CreateJobRequest {
  Body: {
    type: 'chat' | 'task' | 'agent';
    inputType?: JobInputType;
    input: JobInput;
    threadId?: string;
  };
}
export interface GetJobsRequest {
  Querystring: {
    status?: Job['status'];
    type?: Job['type'];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
}
