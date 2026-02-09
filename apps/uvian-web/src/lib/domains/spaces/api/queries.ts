/**
 * Spaces Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { spacesKeys } from './keys';
import { spacesUtils } from '../utils';
import type {
  SpaceAPI,
  SpaceMemberAPI,
  SpaceStats,
  SpaceConversation,
} from '../types';

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
        const { data: spaces } = await apiClient.get<SpaceAPI[]>('/api/spaces');
        return spaces.map(spacesUtils.spaceApiToUi);
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
        const { data } = await apiClient.get<SpaceAPI>(
          `/api/spaces/${spaceId}`
        );
        return spacesUtils.spaceApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all members of a space.
   */
  spaceMembers: (spaceId: string) =>
    queryOptions({
      queryKey: spacesKeys.members(spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceMemberAPI[]>(
          `/api/spaces/${spaceId}/members`
        );
        return data.map(spacesUtils.spaceMemberApiToUi);
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch all conversations in a space.
   */
  spaceConversations: (spaceId: string) =>
    queryOptions({
      queryKey: spacesKeys.conversations(spaceId),
      queryFn: async () => {
        const { data } = await apiClient.get<SpaceConversation[]>(
          `/api/spaces/${spaceId}/conversations`
        );
        return data;
      },
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
