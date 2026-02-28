/**
 * Feed Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const feedKeys = {
  all: ['feed'] as const,
  feed: () => [...feedKeys.all, 'feed'] as const,
  unreadCount: () => [...feedKeys.all, 'unread-count'] as const,
};
