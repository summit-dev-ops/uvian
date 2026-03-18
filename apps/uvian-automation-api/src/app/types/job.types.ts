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
  inputType: JobInputType;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: JobInput;
  output: Record<string, any> | null;
  errorMessage: string | null;
  resourceScopeId: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  spaceId?: string;
  conversationId?: string;
  scopeType?: 'space' | 'conversation';
  threadId?: string;
}

export interface JobFilters {
  status?: Job['status'];
  type?: Job['type'];
  dateFrom?: string;
  dateTo?: string;
  spaceId?: string;
  conversationId?: string;
  scopeType?: 'space' | 'conversation';
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
  scope?: {
    type: 'space' | 'conversation';
    id: string;
    name?: string;
  };
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  resourceScopeId: string;
  spaceId?: string;
  conversationId?: string;
}

export interface GetSpaceJobsRequest {
  Params: {
    spaceId: string;
  };
  Querystring: {
    status?: Job['status'];
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
}

export interface GetConversationJobsRequest {
  Params: {
    conversationId: string;
  };
  Querystring: {
    status?: Job['status'];
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  };
}

export interface JobMetrics {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageProcessingTime?: number;
}

export interface GetJobMetricsRequest {
  Querystring?: {
    dateFrom?: string;
    dateTo?: string;
    spaceId?: string;
    conversationId?: string;
  };
}

export interface ResourceScope {
  id: string;
  spaceId?: string;
  conversationId?: string;
  environment: Record<string, any>;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  scopeType: 'space' | 'conversation';
}

export interface CreateResourceScopeRequest {
  spaceId?: string;
  conversationId?: string;
  environment?: Record<string, any>;
  config?: Record<string, any>;
}

export interface GetResourceScopeByResourceRequest {
  spaceId?: string;
  conversationId?: string;
}

export interface CreateJobRequest {
  Body: {
    type: 'chat' | 'task' | 'agent';
    inputType?: JobInputType;
    input: JobInput;
    resourceScopeId: string;
    threadId?: string;
  };
}
export interface GetJobsRequest {
  Querystring: {
    status?: Job['status'];
    type?: Job['type'];
    dateFrom?: string;
    dateTo?: string;
    spaceId?: string;
    conversationId?: string;
    scopeType?: 'space' | 'conversation';
    threadId?: string;
    page?: number;
    limit?: number;
  };
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
