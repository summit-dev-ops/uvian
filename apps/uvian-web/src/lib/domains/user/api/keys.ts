/**
 * User Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 * Profiles and settings queries are unified - they work for any userId.
 */

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
  agentProfiles: () => [...userKeys.all, 'agentProfiles'] as const,
};
