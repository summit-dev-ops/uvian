/**
 * Job Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating, canceling, retrying, and deleting jobs.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { jobKeys } from './keys';
import type { JobUI } from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateJobMutationPayload = {
  authProfileId: string | undefined
  id?: string; // Optional client-generated ID
  type: string;
  input: Record<string, any>;
};

export type CancelJobMutationPayload = {
  authProfileId: string | undefined
  jobId: string;
};

export type RetryJobMutationPayload = {
  authProfileId: string | undefined
  jobId: string;
};

export type DeleteJobMutationPayload = {
  authProfileId: string | undefined
  jobId: string;
};

// ============================================================================
// Mutation Context Types
// ============================================================================

type CreateJobContext = {
  previousJobs?: JobUI[];
  previousJobList?: any;
};

type CancelJobContext = {
  previousJob?: JobUI;
};

type RetryJobContext = {
  previousJob?: JobUI;
};

type DeleteJobContext = {
  previousJobs?: JobUI[];
  deletedJobIds?: string[];
};

// ============================================================================
// Mutation Options
// ============================================================================

export const jobMutations = {
  /**
   * Create a new job.
   */
  createJob: (
    queryClient: QueryClient
  ): MutationOptions<
    { jobId: string; status: string },
    Error,
    CreateJobMutationPayload,
    CreateJobContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        '/api/jobs',
        {
          type: payload.type,
          input: payload.input,
        },
        {
          headers: { 'x-profile-id': payload.authProfileId },
        }
      );
      return data;
    },

    onSuccess: (_, payload) => {
      // Invalidate job lists to refetch with new job
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(payload.authProfileId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.metrics(payload.authProfileId),
      });
    },
  }),

  /**
   * Cancel a job.
   */
  cancelJob: (
    queryClient: QueryClient
  ): MutationOptions<
    JobUI,
    Error,
    CancelJobMutationPayload,
    CancelJobContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<JobUI>(
        `/api/jobs/${payload.jobId}/cancel`,
        undefined,
        {headers:{
          "x-profile-id": payload.authProfileId
        }}
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: jobKeys.lists(payload.authProfileId),
      });
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.authProfileId, payload.jobId),
      });

      // Snapshot previous state
      const previousJob = queryClient.getQueryData<JobUI>(
        jobKeys.detail(payload.authProfileId, payload.jobId)
      );

      // Optimistically update job status
      const optimisticJob: JobUI = {
        id: payload.jobId,
        type: previousJob?.type || 'unknown',
        status: 'cancelled',
        input: previousJob?.input || {},
        output: previousJob?.output || null,
        errorMessage: null,
        createdAt: previousJob?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: previousJob?.startedAt || null,
        completedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      // Update job detail cache
      queryClient.setQueryData<JobUI>(
        jobKeys.detail(payload.authProfileId, payload.jobId),
        optimisticJob
      );

      return { previousJob };
    },

    onError: (_err, payload, context) => {
      // Rollback on error
      if (context?.previousJob) {
        queryClient.setQueryData(
          jobKeys.detail(payload.authProfileId, payload.jobId),
          context.previousJob
        );
      }
    },

    onSuccess: (_, payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.authProfileId, payload.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(payload.authProfileId),
      });
    },
  }),

  /**
   * Retry a failed/cancelled job.
   */
  retryJob: (
    queryClient: QueryClient
  ): MutationOptions<
    JobUI,
    Error,
    RetryJobMutationPayload,
    RetryJobContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<JobUI>(
        `/api/jobs/${payload.jobId}/retry`,
        undefined,
        {headers:{
          "x-profile-id": payload.authProfileId
        }}
      );
      return data
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.authProfileId,payload.jobId),
      });
      await queryClient.cancelQueries({ queryKey: jobKeys.lists(payload.authProfileId) });

      // Snapshot previous state
      const previousJob = queryClient.getQueryData<JobUI>(
        jobKeys.detail(payload.authProfileId,payload.jobId)
      );

      // Optimistically update job status
      const optimisticJob: JobUI = {
        id: payload.jobId,
        type: previousJob?.type || 'unknown',
        status: 'queued',
        input: previousJob?.input || {},
        output: null,
        errorMessage: null,
        createdAt: previousJob?.createdAt || new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        syncStatus: 'pending',
      };

      // Update job detail cache
      queryClient.setQueryData<JobUI>(
        jobKeys.detail(payload.authProfileId, payload.jobId),
        optimisticJob
      );

      return { previousJob };
    },

    onError: (_err, payload, context) => {
      // Rollback on error
      if (context?.previousJob) {
        queryClient.setQueryData(
          jobKeys.detail(payload.authProfileId, payload.jobId),
          context.previousJob
        );
      }
    },

    onSuccess: (_, payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.authProfileId, payload.jobId),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists(payload.authProfileId) });
    },
  }),

  /**
   * Delete a completed/failed job.
   */
  deleteJob: (
    queryClient: QueryClient
  ): MutationOptions<
    void,
    Error,
    DeleteJobMutationPayload,
    DeleteJobContext
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/jobs/${payload.jobId}`,{headers: {"x-profile-id": payload.authProfileId}});
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobKeys.lists(payload.authProfileId) });
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.authProfileId, payload.jobId),
      });

      // Snapshot current job lists
      const previousJobs = queryClient.getQueryData<JobUI[]>(jobKeys.lists(payload.authProfileId));

      return { previousJobs };
    },

    onError: (_err, payload, context) => {
      // Rollback on error - restore previous jobs list
      if (context?.previousJobs) {
        queryClient.setQueryData(jobKeys.lists(payload.authProfileId), context.previousJobs);
      }

      // Restore job detail cache
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.authProfileId,payload.jobId),
      });
    },

    onSuccess: (_, payload) => {
      // Invalidate metrics
      queryClient.invalidateQueries({ queryKey: jobKeys.metrics(payload.authProfileId) });
    },
  }),

  /**
   * Bulk delete jobs.
   */
  bulkDeleteJobs: (
    queryClient: QueryClient
  ): MutationOptions<
    void,
    Error,
    { jobIds: string[], authProfileId: string },
    { previousJobs?: { jobs: JobUI[] }[] }
  > => ({
    mutationFn: async (payload) => {
      const deletePromises = payload.jobIds.map((jobId) =>
        apiClient.delete(`/api/jobs/${jobId}`)
      );
      await Promise.all(deletePromises);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobKeys.lists(payload.authProfileId) });

      // Remove individual job detail caches
      payload.jobIds.forEach((jobId) => {
        queryClient.removeQueries({ queryKey: jobKeys.detail(payload.authProfileId,jobId) });
      });

      return { previousJobs: [] };
    },

    onError: (_err, payload, context) => {
      // Invalidate to restore job detail caches
      payload.jobIds.forEach((jobId) => {
        queryClient.invalidateQueries({ queryKey: jobKeys.detail(payload.authProfileId,jobId) });
      });
    },

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.metrics(payload.authProfileId) });
    },
  }),
};
