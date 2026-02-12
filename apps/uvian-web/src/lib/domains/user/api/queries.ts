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
import type { ProfileAPI, SettingsAPI, UserSearchParams } from '../types';

// ============================================================================
// API Types for Search Response
// ============================================================================

type ProfileSearchResponseAPI = {
  profiles: ProfileAPI[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  sortBy: 'relevance' | 'createdAt';
  query: string;
  searchFields: string[];
};

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
   * Search profiles for user discovery.
   * Returns public profiles with search and filtering capabilities.
   */
  searchProfiles: (params: UserSearchParams = {}) =>
    queryOptions({
      queryKey: userKeys.search(params),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileSearchResponseAPI>(
          '/api/profiles/search',
          { params }
        );
        return userUtils.searchResultsApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      enabled: Boolean(params.query?.trim()), // Only search when there's a query
    }),
};
