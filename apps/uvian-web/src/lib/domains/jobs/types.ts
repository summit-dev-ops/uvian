/**
 * Job Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * All job IDs are UUIDs (v4).
 */

// ============================================================================
// API Types (Raw data from REST endpoints)
// ============================================================================

export type JobAPI = {
  id: string; // UUID
  type: string; // Job type (chat, task, etc.)
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>; // Job input data
  output: Record<string, any> | null; // Job output data
  error_message: string | null; // Error message if job failed
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  started_at: string | null; // ISO 8601 - when job started processing
  completed_at: string | null; // ISO 8601 - when job completed/failed
};

export type JobListResponseAPI = {
  jobs: JobAPI[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type CreateJobPayload = {
  type: string;
  input: Record<string, any>;
};

export type JobFilters = {
  status?: JobAPI['status'];
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type CancelJobPayload = {
  jobId: string;
};

export type RetryJobPayload = {
  jobId: string;
};

export type DeleteJobPayload = {
  jobId: string;
};

// ============================================================================
// UI Types (Transformed for UI consumption)
// ============================================================================

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type DataSyncStatus = 'synced' | 'pending' | 'error';

export type JobUI = {
  id: string; // UUID
  type: string;
  status: JobStatus;
  input: Record<string, any>;
  output: Record<string, any> | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  duration?: number; // Calculated duration in milliseconds
  syncStatus: DataSyncStatus;
};

export type JobListResponseUI = {
  jobs: JobUI[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type JobFiltersUI = {
  status?: JobStatus;
  type?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  page?: number;
  limit?: number;
};

export type JobAction = 'cancel' | 'retry' | 'delete' | 'view';

export type JobActionResult = {
  jobId: string;
  action: JobAction;
  success: boolean;
  error?: string;
};

// ============================================================================
// Job Display Types
// ============================================================================

export type JobSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'type'
  | 'duration';

export type JobSortOrder = 'asc' | 'desc';

export type JobDisplayOptions = {
  showOutput: boolean;
  showInput: boolean;
  showError: boolean;
  compact: boolean;
};

export type JobMetrics = {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number; // Percentage
  averageDuration?: number;
};

// ============================================================================
// Job Form Types
// ============================================================================

export type CreateJobForm = {
  type: string;
  input: Record<string, any>;
};

export type JobFormErrors = {
  type?: string;
  input?: string;
};

// ============================================================================
// Feature-Specific Types
// ============================================================================

export type JobSelectionState = {
  selectedJobIds: string[];
  isSelecting: boolean;
};

export type JobBulkAction = {
  action: JobAction;
  jobIds: string[];
};

export type JobBulkActionResult = {
  action: JobAction;
  totalJobs: number;
  successCount: number;
  errorCount: number;
  errors: string[];
};

// ============================================================================
// Utility Types
// ============================================================================

export type JobStatusInfo = {
  status: JobStatus;
  label: string;
  color: string;
  description: string;
};

export type JobDuration = {
  total: number;
  processing: number;
  queued: number;
};

export type JobProgress = {
  jobId: string;
  percentage: number;
  stage: string;
  estimatedTimeRemaining?: number;
};
