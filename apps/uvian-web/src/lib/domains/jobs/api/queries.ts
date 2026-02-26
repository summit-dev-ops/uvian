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
    authProfileId: string | undefined,
    spaceId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.listBySpace(authProfileId, spaceId, filters),
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
            headers: { 'x-profile-id': authProfileId },
          }
        );

        return data;
      },
      enabled: !!authProfileId && !!spaceId,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch jobs for a specific conversation.
   */
  listByConversation: (
    authProfileId: string | undefined,
    conversationId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.listByConversation(
        authProfileId,
        conversationId,
        filters
      ),
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
            headers: { 'x-profile-id': authProfileId },
          }
        );

        return data;
      },
      enabled: !!authProfileId && !!conversationId,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch all jobs across all scopes the user has access to (for billing/usage).
   */
  usage: (
    authProfileId: string | undefined,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    queryOptions({
      queryKey: jobKeys.usage(authProfileId, filters),
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
            headers: { 'x-profile-id': authProfileId },
          }
        );

        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch a single job by ID.
   */
  detail: (authProfileId: string | undefined, jobId: string) =>
    queryOptions({
      queryKey: jobKeys.detail(authProfileId, jobId),
      queryFn: async () => {
        const { data } = await apiClient.get<JobUI>(`/api/jobs/${jobId}`, {
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch job metrics for a specific space.
   */
  metricsBySpace: (
    authProfileId: string | undefined,
    spaceId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    queryOptions({
      queryKey: jobKeys.metricsBySpace(
        authProfileId,
        spaceId,
        dateFrom,
        dateTo
      ),
      queryFn: async () => {
        const params: any = { spaceId };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', {
          params,
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId && !!spaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch job metrics for a specific conversation.
   */
  metricsByConversation: (
    authProfileId: string | undefined,
    conversationId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    queryOptions({
      queryKey: jobKeys.metricsByConversation(
        authProfileId,
        conversationId,
        dateFrom,
        dateTo
      ),
      queryFn: async () => {
        const params: any = { conversationId };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', {
          params,
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId && !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
