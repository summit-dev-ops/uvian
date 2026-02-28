/**
 * Spaces Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { spacesKeys } from './keys';
import type { SpaceMemberUI, SpaceStats, SpaceUI } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const spacesQueries = {
  /**
   * Fetch all spaces the user has access to.
   */
  spaces: () =>
    queryOptions({
      queryKey: spacesKeys.list(),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceUI[]>('/api/spaces');
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch a single space by ID.
   */
  space: (spaceId: string) =>
    queryOptions({
      queryKey: spacesKeys.detail(spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceUI>(`/api/spaces/${spaceId}`);
        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all members of a space.
   */
  spaceMembers: (spaceId: string) =>
    queryOptions({
      queryKey: spacesKeys.members(spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceMemberUI[]>(
          `/api/spaces/${spaceId}/members`
        );
        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch space statistics.
   */
  spaceStats: () =>
    queryOptions({
      queryKey: spacesKeys.stats(),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceStats>('/api/spaces/stats');
        return data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    }),
};
