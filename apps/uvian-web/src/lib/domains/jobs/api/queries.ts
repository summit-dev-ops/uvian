/**
 * Job Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { jobKeys } from './keys';
import type { JobFilters, JobListResponseUI, JobUI } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const jobQueries = {
  /**
   * Fetch jobs for a specific space.
   */
  listBySpace: (
    spaceId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.listBySpace(spaceId, filters),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>(
          `/api/spaces/${spaceId}/jobs`,
          {
            params: {
              status: filters?.status,
              type: filters?.type,
              dateFrom: filters?.dateFrom,
              dateTo: filters?.dateTo,
              page: filters?.page || 1,
              limit: filters?.limit || 20,
            },
          }
        );

        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch jobs for a specific conversation.
   */
  listByConversation: (
    conversationId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.listByConversation(conversationId, filters),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>(
          `/api/conversations/${conversationId}/jobs`,
          {
            params: {
              status: filters?.status,
              type: filters?.type,
              dateFrom: filters?.dateFrom,
              dateTo: filters?.dateTo,
              page: filters?.page || 1,
              limit: filters?.limit || 20,
            },
          }
        );

        return data;
      },
      enabled: !!conversationId,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch all jobs across all scopes the user has access to (for billing/usage).
   */
  usage: (
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.usage(filters),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>(
          '/api/jobs/usage',
          {
            params: {
              status: filters?.status,
              type: filters?.type,
              dateFrom: filters?.dateFrom,
              dateTo: filters?.dateTo,
              page: filters?.page || 1,
              limit: filters?.limit || 20,
            },
          }
        );

        return data;
      },
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch a single job by ID.
   */
  detail: (jobId: string) =>
    queryOptions({
      queryKey: jobKeys.detail(jobId),
      queryFn: async () => {
        const { data } = await apiClient.get<JobUI>(`/api/jobs/${jobId}`);
        return data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch job metrics for a specific space.
   */
  metricsBySpace: (spaceId: string, dateFrom?: string, dateTo?: string) =>
    queryOptions({
      queryKey: jobKeys.metricsBySpace(spaceId, dateFrom, dateTo),
      queryFn: async () => {
        const params: Record<string, string> = { spaceId };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', {
          params,
        });
        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch job metrics for a specific conversation.
   */
  metricsByConversation: (
    conversationId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    queryOptions({
      queryKey: jobKeys.metricsByConversation(conversationId, dateFrom, dateTo),
      queryFn: async () => {
        const params: Record<string, string> = { conversationId };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', {
          params,
        });
        return data;
      },
      enabled: !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
