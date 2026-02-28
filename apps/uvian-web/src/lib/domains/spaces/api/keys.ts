/**
 * Spaces Domain Query Key Factory
 */

export const spacesKeys = {
  all: ['spaces'] as const,
  lists: () => [...spacesKeys.all, 'list'] as const,
  list: () => [...spacesKeys.lists()] as const,
  details: () => [...spacesKeys.all, 'detail'] as const,
  detail: (spaceId: string) => [...spacesKeys.details(), spaceId] as const,
  members: (spaceId: string) =>
    [...spacesKeys.detail(spaceId), 'members'] as const,
  conversations: (spaceId: string) =>
    [...spacesKeys.detail(spaceId), 'conversations'] as const,
  stats: () => [...spacesKeys.all, 'stats'] as const,
};
