export interface FeedItem {
  id: string;
  profileId: string;
  type: 'post' | 'message' | 'job' | 'ticket';
  eventType: string;
  sourceId: string;
  sourceType: string;
  readAt: string | null;
  createdAt: string;
}

export interface FeedItemWithDetails extends FeedItem {
  actorId: string | null;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  payload: Record<string, any>;
}

export interface GetFeedRequest {
  Querystring: {
    type?: 'post' | 'message' | 'job' | 'ticket';
    cursor?: string;
    limit?: number;
    spaceId?: string;
  };
}

export interface MarkReadRequest {
  Params: {
    id: string;
  };
}

export interface MarkAllReadRequest {
  Body: {
    type?: 'post' | 'message' | 'job' | 'ticket';
    beforeItemId?: string;
  };
}

export interface GetUnreadCountResponse {
  total: number;
  byType: Record<string, number>;
}
