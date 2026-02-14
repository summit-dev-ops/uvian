/**
 * Spaces Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const spacesKeys = {
  all: ['spaces'] as const,
  lists: (authProfileId: string | undefined) => [...spacesKeys.all, authProfileId, 'list'] as const,
  list: (authProfileId: string | undefined) => [...spacesKeys.lists(authProfileId)] as const,
  details: (authProfileId: string | undefined) =>
    [...spacesKeys.all, authProfileId, 'detail'] as const,
  detail: (authProfileId: string | undefined, spaceId?: string) =>
    [...spacesKeys.details(authProfileId), spaceId] as const,
  members: (authProfileId: string | undefined, spaceId?: string) =>
    [...spacesKeys.detail(authProfileId, spaceId), 'members'] as const,
  conversations: (authProfileId: string | undefined, spaceId?: string) =>
    [...spacesKeys.detail(authProfileId, spaceId), 'conversations'] as const,
  stats: (authProfileId: string | undefined) =>
    [...spacesKeys.all, authProfileId, 'stats'] as const,
};
