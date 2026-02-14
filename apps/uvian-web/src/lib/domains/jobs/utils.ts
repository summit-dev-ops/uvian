/**
 * Job Domain Utilities
 *
 * Transformers and utility functions for job management.
 */

import type { JobUI, JobStatus, JobStatusInfo } from './types';

// ============================================================================
// Duration Calculations
// ============================================================================

/**
 * Calculate job duration in milliseconds.
 */
export function calculateJobDuration(job: JobUI | JobUI): number | null {
  const createdAt = new Date(job.createdAt)

  if (job.completedAt) {
    const completedAt = new Date(job.completedAt)
    return completedAt.getTime() - createdAt.getTime();
  }

  // For ongoing jobs, return time since creation
  const now = new Date();
  return now.getTime() - createdAt.getTime();
}

// ============================================================================
// Job Status Utilities
// ============================================================================

/**
 * Get job status display information.
 */
export function getJobStatusInfo(status: JobStatus): JobStatusInfo {
  const statusMap: Record<JobStatus, JobStatusInfo> = {
    queued: {
      status: 'queued',
      label: 'Queued',
      color: 'text-blue-600',
      description: 'Job is waiting in queue',
    },
    processing: {
      status: 'processing',
      label: 'Processing',
      color: 'text-yellow-600',
      description: 'Job is currently running',
    },
    completed: {
      status: 'completed',
      label: 'Completed',
      color: 'text-green-600',
      description: 'Job completed successfully',
    },
    failed: {
      status: 'failed',
      label: 'Failed',
      color: 'text-red-600',
      description: 'Job failed with an error',
    },
    cancelled: {
      status: 'cancelled',
      label: 'Cancelled',
      color: 'text-gray-600',
      description: 'Job was cancelled',
    },
  };

  return statusMap[status];
}

/**
 * Check if job status allows cancellation.
 */
export function canCancelJob(status: JobStatus): boolean {
  return ['queued', 'processing'].includes(status);
}

/**
 * Check if job status allows retry.
 */
export function canRetryJob(status: JobStatus): boolean {
  return ['failed', 'cancelled'].includes(status);
}

/**
 * Check if job status allows deletion.
 */
export function canDeleteJob(status: JobStatus): boolean {
  return !['processing'].includes(status);
}

/**
 * Check if job is in a terminal state.
 */
export function isTerminalStatus(status: JobStatus): boolean {
  return ['completed', 'failed', 'cancelled'].includes(status);
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format job duration for display.
 */
export function formatJobDuration(milliseconds: number | null): string {
  if (milliseconds === null) return '-';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format job type for display.
 */
export function formatJobType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get relative time string for job timestamps.
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export const jobUtils = {
  calculateJobDuration,
  getJobStatusInfo,
  canCancelJob,
  canRetryJob,
  canDeleteJob,
  isTerminalStatus,
  formatJobDuration,
  formatJobType,
  getRelativeTime,
};
