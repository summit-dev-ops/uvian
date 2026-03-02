/**
 * User Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 * Profiles and settings queries are unified - they work for any profileId.
 */

import type { UserSearchParams } from '../types';

export const profileKeys = {
  all: ['profiles'] as const,
  profile: (profileId?: string) =>
    profileId
      ? ([...profileKeys.all, 'profile', profileId] as const)
      : ([...profileKeys.all, 'profile'] as const),
  userProfiles: () => [...profileKeys.all, 'user-profiles'] as const,
  search: (params?: UserSearchParams) =>
    params
      ? ([...profileKeys.all, 'search', params] as const)
      : ([...profileKeys.all, 'search'] as const),
};
