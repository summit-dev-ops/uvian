/**
 * Feed Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { feedKeys } from './keys';
import type { FeedResponse, UnreadCountResponse } from '../types';

export type FeedQueryOptions = {
  type?: 'post' | 'message' | 'job' | 'ticket';
  cursor?: string;
  limit?: number;
  spaceId?: string;
};

export const feedQueries = {
  feed: (options: FeedQueryOptions = {}) =>
    queryOptions({
      queryKey: feedKeys.feed(),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options.type) params.set('type', options.type);
        if (options.cursor) params.set('cursor', options.cursor);
        if (options.limit) params.set('limit', String(options.limit));
        if (options.spaceId) params.set('spaceId', options.spaceId);

        const { data } = await apiClient.get<FeedResponse>(
          `/api/feed?${params.toString()}`
        );
        return data;
      },
      staleTime: 1000 * 60 * 2,
    }),

  unreadCount: () =>
    queryOptions({
      queryKey: feedKeys.unreadCount(),
      queryFn: async () => {
        const { data } = await apiClient.get<UnreadCountResponse>(
          '/api/feed/unread-count'
        );
        return data;
      },
      staleTime: 1000 * 30,
    }),
};
