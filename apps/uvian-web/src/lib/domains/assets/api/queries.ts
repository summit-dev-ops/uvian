/**
 * Assets Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { assetsKeys } from './keys';
import type {
  AssetUI,
  AssetListResponse,
  ResolvedAsset,
  AssetFilter,
} from '../types';

export const assetsQueries = {
  /**
   * Fetch all assets for the current user's account.
   */
  list: (filters?: AssetFilter) =>
    queryOptions({
      queryKey: assetsKeys.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.type) params.set('type', filters.type);
        if (filters?.page) params.set('page', String(filters.page));
        if (filters?.limit) params.set('limit', String(filters.limit));

        const { data } = await apiClient.get<AssetListResponse>(
          `/api/assets${params.toString() ? `?${params.toString()}` : ''}`
        );
        return data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch a single asset by ID.
   */
  detail: (assetId: string) =>
    queryOptions({
      queryKey: assetsKeys.detail(assetId),
      queryFn: async () => {
        const { data } = await apiClient.get<AssetUI>(`/api/assets/${assetId}`);
        return data;
      },
      enabled: !!assetId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Resolve asset IDs to signed URLs.
   */
  resolved: (assetIds: string[]) =>
    queryOptions({
      queryKey: assetsKeys.resolved(assetIds),
      queryFn: async () => {
        const { data } = await apiClient.post<ResolvedAsset[]>(
          '/api/assets/resolve',
          { assetIds }
        );
        return data;
      },
      enabled: assetIds.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes - URLs expire in 1 hour
    }),
};
