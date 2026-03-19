import { SupabaseClient } from '@supabase/supabase-js';

export class FeedService {
  async getFeed(
    _userClient: SupabaseClient,
    _profileId: string,
    _options: {
      type?: string;
      cursor?: string;
      limit?: number;
      spaceId?: string;
    } = {}
  ): Promise<{
    items: any[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    return { items: [], nextCursor: null, hasMore: false };
  }

  async getUnreadCounts(
    _userClient: SupabaseClient,
    _profileId: string
  ): Promise<{ total: number; byType: Record<string, number> }> {
    return { total: 0, byType: {} };
  }

  async markAsRead(
    _userClient: SupabaseClient,
    _profileId: string,
    _itemId: string
  ): Promise<void> {
    // no-op
  }

  async markAllAsRead(
    _userClient: SupabaseClient,
    _profileId: string,
    _options: { type?: string; beforeItemId?: string } = {}
  ): Promise<void> {
    // no-op
  }

  async createEventAndFeedItems(
    _type: 'post' | 'message' | 'job' | 'ticket',
    _eventType: string,
    _actorId: string | null,
    _resourceScopeId: string,
    _payload: Record<string, any> = {}
  ): Promise<string> {
    return '';
  }

  async createFeedItemsForPost(
    _postId: string,
    _spaceId: string,
    _authorId: string
  ): Promise<void> {}

  async createFeedItemsForMessage(
    _messageId: string,
    _conversationId: string,
    _senderId: string
  ): Promise<void> {}

  async createFeedItemsForJob(
    _jobId: string,
    _jobType: string,
    _status: string,
    _resourceScopeId: string
  ): Promise<void> {}

  async createFeedItemsForTicket(
    _ticketId: string,
    _threadId: string,
    _status: string,
    _resourceScopeId: string
  ): Promise<void> {}
}

export const feedService = new FeedService();
