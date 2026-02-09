/**
 * Spaces Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const spacesKeys = {
  all: ['spaces'] as const,
  lists: () => [...spacesKeys.all, 'list'] as const,
  list: () => [...spacesKeys.lists()] as const,
  details: () => [...spacesKeys.all, 'detail'] as const,
  detail: (id: string) => [...spacesKeys.details(), id] as const,
  members: (spaceId: string) =>
    [...spacesKeys.detail(spaceId), 'members'] as const,
  conversations: (spaceId: string) =>
    [...spacesKeys.detail(spaceId), 'conversations'] as const,
  stats: () => [...spacesKeys.all, 'stats'] as const,
};
