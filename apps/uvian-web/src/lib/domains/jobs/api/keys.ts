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
  detail: (jobId: string) => [...jobKeys.details(), jobId] as const,
  listBySpace: (
    spaceId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) => [...jobKeys.all, 'space', spaceId, 'list', filters] as const,
  listByConversation: (
    conversationId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    [...jobKeys.all, 'conversation', conversationId, 'list', filters] as const,
  usage: (
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) => [...jobKeys.all, 'usage', filters] as const,
  metrics: () => [...jobKeys.all, 'metrics'] as const,
  metricsByDate: (dateFrom?: string, dateTo?: string) =>
    [...jobKeys.metrics(), dateFrom, dateTo] as const,
  metricsBySpace: (spaceId: string, dateFrom?: string, dateTo?: string) =>
    [...jobKeys.metrics(), 'space', spaceId, dateFrom, dateTo] as const,
  metricsByConversation: (
    conversationId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    [
      ...jobKeys.metrics(),
      'conversation',
      conversationId,
      dateFrom,
      dateTo,
    ] as const,
};
