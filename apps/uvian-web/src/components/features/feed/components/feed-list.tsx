'use client';

import { useFeed } from '../hooks/use-feed';
import { useMarkAsRead } from '../hooks/use-feed-mutations';
import { FeedItem } from './feed-item';
import type { FeedItemUI } from '~/lib/domains/feed/types';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

interface FeedListProps {
  type?: 'post' | 'message' | 'job' | 'ticket';
  spaceId?: string;
}

export function FeedList({ type, spaceId }: FeedListProps) {
  const { feed, isLoading } = useFeed({ type, spaceId });
  const markAsRead = useMarkAsRead();
  const { activeProfileId } = useUserSessionStore();

  const handleItemClick = async (item: FeedItemUI) => {
    if (!item.readAt && activeProfileId) {
      await markAsRead.mutateAsync({
        authProfileId: activeProfileId,
        itemId: item.id,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading feed...</div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground">No feed items yet</div>
        <p className="text-sm text-muted-foreground mt-1">
          Activity will appear here when it happens
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {feed.map((item) => (
        <FeedItem key={item.id} item={item} onClick={handleItemClick} />
      ))}
    </div>
  );
}
