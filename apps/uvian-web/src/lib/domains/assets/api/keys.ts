/**
 * Assets Domain API Keys
 *
 * TanStack Query keys for cache management.
 */

export const assetsKeys = {
  all: ['assets'] as const,

  lists: () => [...assetsKeys.all, 'list'] as const,
  list: (filters?: { type?: string; page?: number }) =>
    [...assetsKeys.lists(), filters] as const,

  details: () => [...assetsKeys.all, 'detail'] as const,
  detail: (assetId: string) => [...assetsKeys.details(), assetId] as const,

  resolved: (assetIds: string[]) =>
    [...assetsKeys.all, 'resolved', ...assetIds] as const,
};
