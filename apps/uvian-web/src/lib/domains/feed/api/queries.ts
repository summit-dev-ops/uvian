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
  feed: (authProfileId: string | undefined, options: FeedQueryOptions = {}) =>
    queryOptions({
      queryKey: feedKeys.feed(authProfileId),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options.type) params.set('type', options.type);
        if (options.cursor) params.set('cursor', options.cursor);
        if (options.limit) params.set('limit', String(options.limit));
        if (options.spaceId) params.set('spaceId', options.spaceId);

        const { data } = await apiClient.get<FeedResponse>(
          `/api/feed?${params.toString()}`,
          { headers: { 'x-profile-id': authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 2,
    }),

  unreadCount: (authProfileId: string | undefined) =>
    queryOptions({
      queryKey: feedKeys.unreadCount(authProfileId),
      queryFn: async () => {
        const { data } = await apiClient.get<UnreadCountResponse>(
          '/api/feed/unread-count',
          { headers: { 'x-profile-id': authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 30,
    }),
};
