'use client';

import { useQuery } from '@tanstack/react-query';
import { feedQueries } from '~/lib/domains/feed/api/queries';

export const useFeed = (options?: {
  type?: 'post' | 'message' | 'job' | 'ticket';
  cursor?: string;
  limit?: number;
  spaceId?: string;
}) => {
  const { data, isLoading, error, refetch } = useQuery(
    feedQueries.feed(options || {})
  );

  return {
    feed: data?.items || [],
    nextCursor: data?.nextCursor || null,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
  };
};

export const useUnreadCount = () => {
  const { data, isLoading, error, refetch } = useQuery(
    feedQueries.unreadCount()
  );

  return {
    unreadCount: data?.total || 0,
    unreadByType: data?.byType || {},
    isLoading,
    error,
    refetch,
  };
};
