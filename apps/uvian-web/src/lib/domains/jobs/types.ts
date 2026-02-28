/**
 * Job Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * All job IDs are UUIDs (v4).
 */

export type CreateJobPayload = {
  type: string;
  input: Record<string, any>;
  resourceScopeId: string;
};

export type JobFilters = {
  status?: JobStatus;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  spaceId?: string; // Filter jobs by space
  conversationId?: string; // Filter jobs by conversation
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

export type JobUI = {
  id: string; // UUID
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
  // Enhanced fields from API (populated via joins)
  spaceId?: string; // The space this job operates in
  conversationId?: string; // The conversation this job operates in
  scopeType?: 'space' | 'conversation'; // Type of resource scope
};

export type JobListResponseUI = {
  jobs: JobUI[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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
  averageDuration?: number; // in milliseconds
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
