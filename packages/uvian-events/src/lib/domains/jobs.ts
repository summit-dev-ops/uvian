import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const JobEvents = {
  JOB_CREATED: `${prefix}.job.job_created`,
  JOB_STARTED: `${prefix}.job.job_started`,
  JOB_COMPLETED: `${prefix}.job.job_completed`,
  JOB_FAILED: `${prefix}.job.job_failed`,
  JOB_CANCELLED: `${prefix}.job.job_cancelled`,
  JOB_RETRY: `${prefix}.job.job_retry`,
} as const;

export type JobEventType = (typeof JobEvents)[keyof typeof JobEvents];

export interface JobCreatedData {
  jobId: string;
  jobType: string;
  inputPayload: Record<string, unknown>;
  createdBy: string;
}

export interface JobStartedData {
  jobId: string;
  startedBy: string;
}

export interface JobCompletedData {
  jobId: string;
  outputPayload?: Record<string, unknown>;
}

export interface JobFailedData {
  jobId: string;
  error: string;
  reason?: string;
}

export interface JobCancelledData {
  jobId: string;
  cancelledBy: string;
}

export interface JobRetryData {
  jobId: string;
  retryCount: number;
}

export type JobEventData =
  | JobCreatedData
  | JobStartedData
  | JobCompletedData
  | JobFailedData
  | JobCancelledData
  | JobRetryData;
