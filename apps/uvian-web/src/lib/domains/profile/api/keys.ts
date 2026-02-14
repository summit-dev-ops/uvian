/**
 * User Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 * Profiles and settings queries are unified - they work for any userId.
 */

import type { ProfileSearchParams } from '../types';

export const profileKeys = {
  all: ['profiles'] as const,
  profile: (profileId?: string) =>
    profileId
      ? ([...profileKeys.all, 'profile', profileId] as const)
      : ([...profileKeys.all, 'profile'] as const),
  search: (params?: ProfileSearchParams) =>
    params
      ? ([...profileKeys.all, 'search', params] as const)
      : ([...profileKeys.all, 'search'] as const),
};
