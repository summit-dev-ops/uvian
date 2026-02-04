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
import { userUtils } from '../utils';
import type { ProfileAPI, SettingsAPI } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const userQueries = {
  /**
   * Fetch a profile by profileId.
   * If no profileId provided, fetches current user's profile.
   */
  profile: (profileId?: string) =>
    queryOptions({
      queryKey: userKeys.profile(profileId),
      queryFn: async () => {
        const endpoint = profileId
          ? `/api/profiles/${profileId}`
          : `/api/profiles/me`;
        const { data } = await apiClient.get<ProfileAPI>(endpoint);
        return userUtils.profileApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch current user's settings.
   * Note: Settings are private to the authenticated user.
   */
  settings: () =>
    queryOptions({
      queryKey: userKeys.settings(),
      queryFn: async () => {
        const { data } = await apiClient.get<SettingsAPI>(
          `/api/profiles/me/settings`
        );
        return userUtils.settingsApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch agent profiles (for humans).
   */
  agentProfiles: () =>
    queryOptions({
      queryKey: userKeys.agentProfiles(),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileAPI[]>(
          `/api/profiles/agents`
        );
        return data.map((profile) => userUtils.profileApiToUi(profile));
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Legacy method for backward compatibility.
   * Use profile(profileId) instead.
   */
  publicProfile: (profileId: string) =>
    queryOptions({
      queryKey: userKeys.profile(profileId),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileAPI>(
          `/api/profiles/${profileId}`
        );
        return userUtils.publicProfileApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
