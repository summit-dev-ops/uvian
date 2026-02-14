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
  spaces: (authProfileId: string | undefined) =>
    queryOptions({
      queryKey: spacesKeys.list(authProfileId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceUI[]>('/api/spaces', {
          headers: { "x-profile-id": authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch a single space by ID.
   */
  space: (authProfileId: string | undefined, spaceId?: string) =>
    queryOptions({
      queryKey: spacesKeys.detail(authProfileId, spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceUI>(
          `/api/spaces/${spaceId}`,
          { headers: { "x-profile-id": authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId && !!spaceId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all members of a space.
   */
  spaceMembers: (authProfileId: string | undefined, spaceId?: string) =>
    queryOptions({
      queryKey: spacesKeys.members(authProfileId, spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceMemberUI[]>(
          `/api/spaces/${spaceId}/members`,
          { headers: { "x-profile-id": authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId && !!spaceId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch space statistics.
   */
  spaceStats: (authProfileId: string) =>
    queryOptions({
      queryKey: spacesKeys.stats(authProfileId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceStats>('/api/spaces/stats', {
          headers: { "x-profile-id": authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }),
};
