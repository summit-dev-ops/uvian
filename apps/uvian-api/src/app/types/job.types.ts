
export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
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
