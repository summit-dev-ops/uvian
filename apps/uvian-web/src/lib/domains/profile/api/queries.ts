import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { profileKeys } from './keys';
import type {
  ProfileSearchParams,
  ProfileSearchResults,
  ProfileUI,
} from '../types';

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
      queryKey: profileKeys.profile(),
      queryFn: async () => {
        const { data } = await apiClient.get<{ profiles: ProfileUI[] }>(
          '/api/users/me/profiles'
        );
        return data.profiles;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  /**
   * Search profiles for user discovery.
   * Returns public profiles with search and filtering capabilities.
   */
  searchProfiles: (params: ProfileSearchParams = {}) =>
    queryOptions({
      queryKey: profileKeys.search(params),
      queryFn: async () => {
        const { data } = await apiClient.get<ProfileSearchResults>(
          '/api/profiles/search',
          { params }
        );
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      enabled: Boolean(params.query?.trim()), // Only search when there's a query
    }),
};
