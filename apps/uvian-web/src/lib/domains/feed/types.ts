/**
 * Feed Domain Types
 *
 * UI-specific type definitions for feed items.
 */

export interface FeedItemUI {
  id: string;
  profileId: string;
  type: 'post' | 'message' | 'job' | 'ticket';
  eventType: string;
  sourceId: string;
  sourceType: string;
  readAt: string | null;
  createdAt: string;
  actorId: string | null;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  payload: Record<string, any>;
}

export interface FeedResponse {
  items: FeedItemUI[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  total: number;
  byType: Record<string, number>;
}
