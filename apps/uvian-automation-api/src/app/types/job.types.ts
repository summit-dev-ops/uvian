export interface Job {
  id: string;
  type: 'chat' | 'task' | 'agent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
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
    input: Record<string, any>;
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
