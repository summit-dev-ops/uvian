export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output: Record<string, any> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobFilters {
  status?: Job['status'];
  type?: string;
  dateFrom?: string;
  dateTo?: string;
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


export interface CreateJobRequest {
  Body: {
    type: string;
    input: Record<string, any>
  }
}
export interface GetJobsRequest {
  Params: string 
}

export interface GetJobRequest {
  Params: {
    id:string
  }
}
export interface CancelJobRequest {
  Params: {
    id:string
  }
}
export interface RetryJobRequest {
  Params: {
    id:string
  }
}
export interface DeleteJobRequest {
  Params: {
    id:string
  }
}

