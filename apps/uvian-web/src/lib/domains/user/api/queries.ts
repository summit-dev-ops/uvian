/**
 * User Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 * Unified approach: profiles and settings work for any profileId.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { userKeys } from './keys';
import { SettingsUI } from '../types';
import type { ProfileUI } from '~/lib/domains/profile/types';

// ============================================================================
// Query Options
// ============================================================================

export const userQueries = {
  /**
   * Fetch a profile by userId.
   * Queries the profiles table by user_id column via /api/users/:userId/profile.
   */
  profileByUserId: (userId: string) =>
    queryOptions({
      queryKey: userKeys.profileByUserId(userId),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileUI>(
          `/api/users/${userId}/profile`
        );
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  /**
   * Fetch multiple profiles by userIds.
   */
  profilesByUserIds: (userIds: string[]) =>
    queryOptions({
      queryKey: userKeys.profilesByUserIds(userIds),
      queryFn: async () => {
        const results: Record<string, ProfileUI> = {};
        await Promise.all(
          userIds.map(async (userId) => {
            try {
              const { data } = await apiClient.get<ProfileUI>(
                `/api/users/${userId}/profile`
              );
              if (data) {
                results[userId] = data;
              }
            } catch {
              // Skip failed fetches
            }
          })
        );
        return results;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: userIds.length > 0,
    }),
  /**
   * Fetch current user's settings.
   * Note: Settings are private to the authenticated user.
   */
  settings: () =>
    queryOptions({
      queryKey: userKeys.settings(),
      queryFn: async () => {
        const { data } = await apiClient.get<SettingsUI>(
          `/api/users/me/settings`
        );
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
