/**
 * Job Domain Query Keys
 *
 * Consistent query key factory pattern for TanStack Query cache management.
 */

import type { JobFilters } from '../types';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  byStatus: (status: string) => [...jobKeys.all, 'status', status] as const,
  byType: (type: string) => [...jobKeys.all, 'type', type] as const,
  metrics: () => [...jobKeys.all, 'metrics'] as const,
  metricsByDate: (dateFrom?: string, dateTo?: string) =>
    [...jobKeys.metrics(), dateFrom, dateTo] as const,
};
