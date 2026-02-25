'use client';

import { useQuery } from '@tanstack/react-query';
import { feedQueries } from '~/lib/domains/feed/api/queries';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

export const useFeed = (options?: {
  type?: 'post' | 'message' | 'job' | 'ticket';
  cursor?: string;
  limit?: number;
  spaceId?: string;
}) => {
  const { activeProfileId } = useUserSessionStore();
  const { data, isLoading, error, refetch } = useQuery(
    feedQueries.feed(activeProfileId || undefined, options || {})
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
  const { activeProfileId } = useUserSessionStore();
  const { data, isLoading, error, refetch } = useQuery(
    feedQueries.unreadCount(activeProfileId || undefined)
  );

  return {
    unreadCount: data?.total || 0,
    unreadByType: data?.byType || {},
    isLoading,
    error,
    refetch,
  };
};
