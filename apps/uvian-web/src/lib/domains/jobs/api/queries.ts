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
import type { JobAPI, JobListResponseAPI, JobFilters } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const jobQueries = {
  /**
   * Fetch jobs with filtering and pagination.
   */
  list: (filters: JobFilters = {}) =>
    queryOptions({
      queryKey: jobKeys.list(filters),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseAPI>('/api/jobs', {
          params: {
            status: filters.status,
            type: filters.type,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            page: filters.page || 1,
            limit: filters.limit || 20,
          },
        });

        return {
          ...data,
          jobs: data.jobs.map(jobUtils.jobApiToUi),
        };
      },
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: true,
    }),

  /**
   * Fetch a single job by ID.
   */
  detail: (id: string) =>
    queryOptions({
      queryKey: jobKeys.detail(id),
      queryFn: async () => {
        const { data } = await apiClient.get<JobAPI>(`/api/jobs/${id}`);
        return jobUtils.jobApiToUi(data);
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch jobs by status.
   */
  byStatus: (status: string) =>
    queryOptions({
      queryKey: jobKeys.byStatus(status),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseAPI>('/api/jobs', {
          params: { status },
        });
        return {
          ...data,
          jobs: data.jobs.map(jobUtils.jobApiToUi),
        };
      },
      staleTime: 1000 * 30, // 30 seconds
    }),

  /**
   * Fetch jobs by type.
   */
  byType: (type: string) =>
    queryOptions({
      queryKey: jobKeys.byType(type),
      queryFn: async () => {
        const { data } = await apiClient.get<JobListResponseAPI>('/api/jobs', {
          params: { type },
        });
        return {
          ...data,
          jobs: data.jobs.map(jobUtils.jobApiToUi),
        };
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch job metrics.
   */
  metrics: (dateFrom?: string, dateTo?: string) =>
    queryOptions({
      queryKey: jobKeys.metricsByDate(dateFrom, dateTo),
      queryFn: async () => {
        const params: any = {};
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await apiClient.get('/api/jobs/metrics', { params });
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
