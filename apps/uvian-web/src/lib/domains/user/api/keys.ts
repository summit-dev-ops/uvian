/**
 * User Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 * Profiles and settings queries are unified - they work for any profileId.
 */

export const userKeys = {
  all: ['user'] as const,
  settings: (userId?: string) =>
    userId
      ? ([...userKeys.all, 'settings', userId] as const)
      : ([...userKeys.all, 'settings'] as const),
  profiles: () => [...userKeys.all, 'profiles'] as const,
  profileByUserId: (userId?: string) =>
    userId
      ? ([...userKeys.all, 'profile-by-user', userId] as const)
      : ([...userKeys.all, 'profile-by-user'] as const),
  profilesByUserIds: (userIds: string[]) =>
    [...userKeys.all, 'profiles-by-user-ids', ...userIds.sort()] as const,
};
