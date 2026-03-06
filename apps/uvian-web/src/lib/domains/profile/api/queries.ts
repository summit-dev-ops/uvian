import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { profileKeys } from './keys';
import type { ProfileUI, UserSearchParams, UserSearchResults } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const profileQueries = {
  /**
   * Fetch a profile by profileId.
   * If no profileId provided, fetches current user's profile.
   */
  profile: (profileId?: string) =>
    queryOptions({
      queryKey: profileKeys.profile(profileId),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileUI>(
          `/api/profiles/${profileId}`
        );
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  /**
   * Fetch all profiles for the current authenticated user.
   * Returns both human and agent profiles owned by the current user.
   */
  userProfiles: () =>
    queryOptions({
      queryKey: profileKeys.userProfiles(),
      queryFn: async () => {
        const { data } = await apiClient.get<{ profiles: ProfileUI[] }>(
          '/api/users/me/profiles'
        );
        return data.profiles;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  /**
   * Search users (merged with profiles) for user discovery.
   * Returns users with their profile data.
   */
  searchUsers: (params: UserSearchParams = {}) =>
    queryOptions({
      queryKey: profileKeys.search({
        query: params.query,
        page: params.page,
        limit: params.limit,
        searchContext: params.searchContext,
      }),
      queryFn: async () => {
        const { data } = await apiClient.get<UserSearchResults>(
          '/api/users/search',
          {
            params: {
              q: params.query,
              page: params.page,
              limit: params.limit,
              searchContext: params.searchContext
                ? JSON.stringify(params.searchContext)
                : undefined,
            },
          }
        );
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      enabled: Boolean(params.query?.trim()), // Only search when there's a query
    }),
};
