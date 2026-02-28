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
  id?: string; // Optional client-generated ID
  type: string;
  input: Record<string, any>;
  resourceScopeId: string;
};

export type CancelJobMutationPayload = {
  jobId: string;
};

export type RetryJobMutationPayload = {
  jobId: string;
};

export type DeleteJobMutationPayload = {
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
    JobUI,
    Error,
    CreateJobMutationPayload,
    CreateJobContext
  > => ({
    mutationFn: async (payload): Promise<JobUI> => {
      const { data } = await apiClient.post<JobUI>('/api/jobs', {
        type: payload.type,
        input: payload.input,
        resourceScopeId: payload.resourceScopeId,
      });
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.metrics(),
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
        undefined
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: jobKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });

      const previousJob = queryClient.getQueryData<JobUI>(
        jobKeys.detail(payload.jobId)
      );

      const optimisticJob: JobUI = {
        id: payload.jobId,
        type: previousJob?.type || 'unknown',
        status: 'cancelled',
        input: previousJob?.input || {},
        output: previousJob?.output || null,
        errorMessage: null,
        resourceScopeId: previousJob?.resourceScopeId || '',
        createdAt: previousJob?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: previousJob?.startedAt || null,
        completedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<JobUI>(
        jobKeys.detail(payload.jobId),
        optimisticJob
      );

      return { previousJob };
    },

    onError: (_err, payload, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(
          jobKeys.detail(payload.jobId),
          context.previousJob
        );
      }
    },

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
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
        undefined
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });
      await queryClient.cancelQueries({
        queryKey: jobKeys.lists(),
      });

      const previousJob = queryClient.getQueryData<JobUI>(
        jobKeys.detail(payload.jobId)
      );

      const optimisticJob: JobUI = {
        id: payload.jobId,
        type: previousJob?.type || 'unknown',
        status: 'queued',
        input: previousJob?.input || {},
        output: null,
        errorMessage: null,
        resourceScopeId: previousJob?.resourceScopeId || '',
        createdAt: previousJob?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      };

      queryClient.setQueryData<JobUI>(
        jobKeys.detail(payload.jobId),
        optimisticJob
      );

      return { previousJob };
    },

    onError: (_err, payload, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(
          jobKeys.detail(payload.jobId),
          context.previousJob
        );
      }
    },

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobKeys.lists(),
      });
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
      await apiClient.delete(`/api/jobs/${payload.jobId}`);
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: jobKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });

      const previousJobs = queryClient.getQueryData<JobUI[]>(jobKeys.lists());

      return { previousJobs };
    },

    onError: (_err, payload, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(jobKeys.lists(), context.previousJobs);
      }

      queryClient.invalidateQueries({
        queryKey: jobKeys.detail(payload.jobId),
      });
    },

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: jobKeys.metrics(),
      });
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
    { jobIds: string[] },
    { previousJobs?: { jobs: JobUI[] }[] }
  > => ({
    mutationFn: async (payload) => {
      const deletePromises = payload.jobIds.map((jobId) =>
        apiClient.delete(`/api/jobs/${jobId}`)
      );
      await Promise.all(deletePromises);
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: jobKeys.lists(),
      });

      payload.jobIds.forEach((jobId) => {
        queryClient.removeQueries({
          queryKey: jobKeys.detail(jobId),
        });
      });

      return { previousJobs: [] };
    },

    onError: (_err, payload, _context) => {
      payload.jobIds.forEach((jobId) => {
        queryClient.invalidateQueries({
          queryKey: jobKeys.detail(jobId),
        });
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jobKeys.metrics(),
      });
    },
  }),
};
