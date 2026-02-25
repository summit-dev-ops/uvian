/**
 * Feed Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const feedKeys = {
  all: ['feed'] as const,
  feed: (profileId?: string) => [...feedKeys.all, profileId, 'feed'] as const,
  unreadCount: (profileId?: string) =>
    [...feedKeys.all, profileId, 'unread-count'] as const,
};
