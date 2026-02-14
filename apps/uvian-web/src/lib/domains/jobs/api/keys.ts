/**
 * Job Domain Query Keys
 *
 * Consistent query key factory pattern for TanStack Query cache management.
 */

import type { JobFilters } from '../types';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: (authProfileId: string | undefined) =>
    [...jobKeys.all, authProfileId, 'list'] as const,
  list: (authProfileId: string | undefined, filters: JobFilters) =>
    [...jobKeys.lists(authProfileId), filters] as const,
  details: (authProfileId: string | undefined) =>
    [...jobKeys.all, authProfileId, 'detail'] as const,
  detail: (authProfileId: string | undefined, jobId: string) =>
    [...jobKeys.details(authProfileId), jobId] as const,
  byStatus: (authProfileId: string | undefined, status: string) =>
    [...jobKeys.all, authProfileId, 'status', status] as const,
  byType: (authProfileId: string | undefined, type: string) =>
    [...jobKeys.all, authProfileId, 'type', type] as const,
  metrics: (authProfileId: string | undefined) =>
    [...jobKeys.all, authProfileId, 'metrics'] as const,
  metricsByDate: (
    authProfileId: string | undefined,
    dateFrom?: string,
    dateTo?: string
  ) => [...jobKeys.metrics(authProfileId), dateFrom, dateTo] as const,
};
