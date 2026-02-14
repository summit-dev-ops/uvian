/**
 * Job Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * All job IDs are UUIDs (v4).
 */

export type CreateJobPayload = {
  authProfileId: string | undefined
  type: string;
  input: Record<string, any>;
};

export type JobFilters = {
  authProfileId: string | undefined
  status?: JobStatus;
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
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
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
  dateFrom?: string | null;
  dateTo?: string | null;
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
