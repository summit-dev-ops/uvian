export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output: Record<string, any> | null;
  errorMessage: string | null;
  resourceScopeId: string; // Internal reference to resource scope
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  // Enhanced fields for UI context (populated via joins)
  spaceId?: string; // The space this job operates in
  conversationId?: string; // The conversation this job operates in
  scopeType?: 'space' | 'conversation'; // Type of resource scope
}

export interface JobFilters {
  status?: Job['status'];
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  spaceId?: string; // Filter jobs by space
  conversationId?: string; // Filter jobs by conversation
  scopeType?: 'space' | 'conversation'; // Filter by scope type
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
  // Optional context information
  scope?: {
    type: 'space' | 'conversation';
    id: string;
    name?: string; // Space name or conversation title
  };
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  resourceScopeId: string;
  spaceId?: string;
  conversationId?: string;
}

// Specific request types for scoped job operations
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

// Enhanced job metrics that can be scoped to spaces or conversations
export interface JobMetrics {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageProcessingTime?: number; // in milliseconds
}

export interface GetJobMetricsRequest {
  Params?: {
    scopeType?: 'space' | 'conversation';
    scopeId?: string;
  };
  Querystring?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

// Resource scope information (internal use)
export interface ResourceScope {
  id: string;
  spaceId?: string;
  conversationId?: string;
  environment: Record<string, any>;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  scopeType: 'space' | 'conversation';
}

// Internal service interfaces for resource scope management
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
    type: string;
    input: Record<string, any>;
    resourceScopeId: string;
  };
}
export interface GetJobsRequest {
  Querystring: {
    status?: Job['status'];
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    spaceId?: string; // Filter by specific space
    conversationId?: string; // Filter by specific conversation
    scopeType?: 'space' | 'conversation'; // Filter by scope type
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
