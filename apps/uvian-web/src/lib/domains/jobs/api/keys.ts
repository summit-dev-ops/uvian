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
  listBySpace: (
    authProfileId: string | undefined,
    spaceId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    [...jobKeys.all, authProfileId, 'space', spaceId, 'list', filters] as const,
  listByConversation: (
    authProfileId: string | undefined,
    conversationId: string,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) =>
    [
      ...jobKeys.all,
      authProfileId,
      'conversation',
      conversationId,
      'list',
      filters,
    ] as const,
  usage: (
    authProfileId: string | undefined,
    filters?: Omit<JobFilters, 'spaceId' | 'conversationId' | 'authProfileId'>
  ) => [...jobKeys.all, authProfileId, 'usage', filters] as const,
  metrics: (authProfileId: string | undefined) =>
    [...jobKeys.all, authProfileId, 'metrics'] as const,
  metricsByDate: (
    authProfileId: string | undefined,
    dateFrom?: string,
    dateTo?: string
  ) => [...jobKeys.metrics(authProfileId), dateFrom, dateTo] as const,
  metricsBySpace: (
    authProfileId: string | undefined,
    spaceId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    [
      ...jobKeys.metrics(authProfileId),
      'space',
      spaceId,
      dateFrom,
      dateTo,
    ] as const,
  metricsByConversation: (
    authProfileId: string | undefined,
    conversationId: string,
    dateFrom?: string,
    dateTo?: string
  ) =>
    [
      ...jobKeys.metrics(authProfileId),
      'conversation',
      conversationId,
      dateFrom,
      dateTo,
    ] as const,
};
