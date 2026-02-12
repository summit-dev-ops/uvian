/**
 * User Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 * Profiles and settings queries are unified - they work for any userId.
 */

import type { UserSearchParams } from '../types';

export const userKeys = {
  all: ['user'] as const,
  profile: (profileId?: string) =>
    profileId
      ? ([...userKeys.all, 'profile', profileId] as const)
      : ([...userKeys.all, 'profile'] as const),
  settings: (profileId?: string) =>
    profileId
      ? ([...userKeys.all, 'settings', profileId] as const)
      : ([...userKeys.all, 'settings'] as const),
  search: (params?: UserSearchParams) =>
    params
      ? ([...userKeys.all, 'search', params] as const)
      : ([...userKeys.all, 'search'] as const),
};
