/**
 * Job Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { jobKeys } from './keys';
import { jobUtils } from '../utils';
import type { JobFilters, JobListResponseUI, JobUI } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const jobQueries = {
  /**
   * Fetch jobs with filtering and pagination.
   */
  list: (filters: JobFilters) =>
    queryOptions({
      queryKey: jobKeys.list(filters.authProfileId, filters),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>('/api/jobs', {
          params: {
            status: filters.status,
            type: filters.type,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            page: filters.page || 1,
            limit: filters.limit || 20,
          },
          headers: { 'x-profile-id': filters.authProfileId },
        });

        return data;
      },
      enabled: !!filters.authProfileId,
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
   * Fetch jobs by status.
   */
  byStatus: (authProfileId: string | undefined, status: string) =>
    queryOptions({
      queryKey: jobKeys.byStatus(authProfileId, status),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>('/api/jobs', {
          params: { status },
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 30, // 30 seconds
    }),

  /**
   * Fetch jobs by type.
   */
  byType: (authProfileId: string | undefined, type: string) =>
    queryOptions({
      queryKey: jobKeys.byType(authProfileId, type),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseUI>('/api/jobs', {
          params: { type },
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch job metrics.
   */
  metrics: (
    authProfileId: string | undefined,
    dateFrom?: string,
    dateTo?: string
  ) =>
    queryOptions({
      queryKey: jobKeys.metricsByDate(authProfileId, dateFrom, dateTo),
      queryFn: async () => {
        const params: any = {};
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', {
          params,
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
