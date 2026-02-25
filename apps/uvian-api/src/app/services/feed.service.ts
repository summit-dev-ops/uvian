import { adminSupabase } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import { FeedItem, FeedItemWithDetails } from '../types/feed.types';

export class FeedService {
  async createEventAndFeedItems(
    type: 'post' | 'message' | 'job' | 'ticket',
    eventType: string,
    actorId: string | null,
    resourceScopeId: string,
    payload: Record<string, any> = {}
  ): Promise<string> {
    const { data: event, error: eventError } = await adminSupabase
      .from('events')
      .insert({
        type,
        event_type: eventType,
        actor_id: actorId,
        resource_scope_id: resourceScopeId,
        payload,
      })
      .select()
      .single();

    if (eventError) throw new Error(eventError.message);

    await this.createFeedItemsFromEvent(
      event.id,
      type,
      eventType,
      resourceScopeId
    );

    return event.id;
  }

  private async createFeedItemsFromEvent(
    eventId: string,
    type: 'post' | 'message' | 'job' | 'ticket',
    eventType: string,
    resourceScopeId: string
  ): Promise<void> {
    const { data: scope, error: scopeError } = await adminSupabase
      .from('resource_scopes')
      .select('space_id, conversation_id')
      .eq('id', resourceScopeId)
      .single();

    if (scopeError || !scope) return;

    let memberProfileIds: string[] = [];

    if (scope.space_id) {
      const { data: members } = await adminSupabase
        .from('space_members')
        .select('profile_id')
        .eq('space_id', scope.space_id);
      memberProfileIds = members?.map((m) => m.profile_id) || [];
    } else if (scope.conversation_id) {
      const { data: members } = await adminSupabase
        .from('conversation_members')
        .select('profile_id')
        .eq('conversation_id', scope.conversation_id);
      memberProfileIds = members?.map((m) => m.profile_id) || [];
    }

    if (memberProfileIds.length === 0) return;

    const feedItems = memberProfileIds.map((profileId) => ({
      profile_id: profileId,
      type,
      event_type: eventType,
      source_id: eventId,
      source_type: 'event',
      read_at: null,
    }));

    const { error } = await adminSupabase.from('feed_items').insert(feedItems);

    if (error) throw new Error(error.message);
  }

  async createFeedItemsForPost(
    postId: string,
    spaceId: string,
    authorId: string
  ): Promise<void> {
    const { data: scope, error: scopeError } = await adminSupabase
      .from('resource_scopes')
      .select('id')
      .eq('space_id', spaceId)
      .single();

    if (scopeError || !scope) return;

    await this.createEventAndFeedItems(
      'post',
      'post_created',
      authorId,
      scope.id,
      { postId }
    );
  }

  async createFeedItemsForMessage(
    messageId: string,
    conversationId: string,
    senderId: string
  ): Promise<void> {
    const { data: scope, error: scopeError } = await adminSupabase
      .from('resource_scopes')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();

    if (scopeError || !scope) return;

    await this.createEventAndFeedItems(
      'message',
      'message_sent',
      senderId,
      scope.id,
      { messageId }
    );
  }

  async createFeedItemsForJob(
    jobId: string,
    jobType: string,
    status: string,
    resourceScopeId: string
  ): Promise<void> {
    const eventType =
      status === 'completed'
        ? 'job_completed'
        : status === 'failed'
        ? 'job_failed'
        : status === 'cancelled'
        ? 'job_cancelled'
        : 'job_created';

    await this.createEventAndFeedItems(
      'job',
      eventType,
      null,
      resourceScopeId,
      { jobId, jobType, status }
    );
  }

  async createFeedItemsForTicket(
    ticketId: string,
    threadId: string,
    status: string,
    resourceScopeId: string
  ): Promise<void> {
    const eventType =
      status === 'resolved'
        ? 'ticket_resolved'
        : status === 'open'
        ? 'ticket_created'
        : 'ticket_updated';

    await this.createEventAndFeedItems(
      'ticket',
      eventType,
      null,
      resourceScopeId,
      { ticketId, threadId, status }
    );
  }

  async getFeed(
    userClient: SupabaseClient,
    profileId: string,
    options: {
      type?: string;
      cursor?: string;
      limit?: number;
      spaceId?: string;
    } = {}
  ): Promise<{
    items: FeedItemWithDetails[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const limit = options.limit || 20;

    let query = adminSupabase
      .from('feed_items')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.cursor) {
      const { data: cursorItem } = await adminSupabase
        .from('feed_items')
        .select('created_at')
        .eq('id', options.cursor)
        .single();

      if (cursorItem) {
        query = query.lt('created_at', cursorItem.created_at);
      }
    }

    if (options.spaceId) {
      const { data: scopeIds } = await adminSupabase
        .from('resource_scopes')
        .select('id')
        .eq('space_id', options.spaceId);

      if (scopeIds && scopeIds.length > 0) {
        const scopeIdList = scopeIds.map((s) => s.id);
        const { data: eventIds } = await adminSupabase
          .from('events')
          .select('id')
          .in('resource_scope_id', scopeIdList);

        if (eventIds && eventIds.length > 0) {
          const eventIdList = eventIds.map((e) => e.id);
          query = query.in('source_id', eventIdList);
        }
      }
    }

    const { data: items, error } = await query;

    if (error) throw new Error(error.message);

    const hasMore = items.length > limit;
    const feedItems = hasMore ? items.slice(0, limit) : items;

    const itemsWithDetails = await this.enrichFeedItems(feedItems);

    return {
      items: itemsWithDetails,
      nextCursor: hasMore ? feedItems[feedItems.length - 1].id : null,
      hasMore,
    };
  }

  private async enrichFeedItems(
    items: FeedItem[]
  ): Promise<FeedItemWithDetails[]> {
    if (items.length === 0) return [];

    const eventIds = [...new Set(items.map((i) => i.sourceId))];

    const { data: events } = await adminSupabase
      .from('events')
      .select('id, type, event_type, actor_id, payload')
      .in('id', eventIds);

    if (!events || events.length === 0) {
      return items.map((item) => ({
        ...item,
        actorId: null,
        actorDisplayName: null,
        actorAvatarUrl: null,
        payload: {},
      }));
    }

    const actorIds = [
      ...new Set(events.map((e) => e.actor_id).filter(Boolean)),
    ];

    const actorProfiles: Record<string, any> = {};

    if (actorIds.length > 0) {
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', actorIds);

      if (profiles) {
        profiles.forEach((p) => {
          actorProfiles[p.id] = {
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
          };
        });
      }
    }

    const eventMap = new Map(events.map((e) => [e.id, e]));

    return items.map((item) => {
      const event = eventMap.get(item.sourceId);
      const actor = event?.actor_id ? actorProfiles[event.actor_id] : null;

      return {
        ...item,
        actorId: event?.actor_id || null,
        actorDisplayName: actor?.displayName || null,
        actorAvatarUrl: actor?.avatarUrl || null,
        payload: event?.payload || {},
      };
    });
  }

  async markAsRead(
    userClient: SupabaseClient,
    profileId: string,
    itemId: string
  ): Promise<void> {
    const { error } = await adminSupabase
      .from('feed_items')
      .update({ read_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('profile_id', profileId);

    if (error) throw new Error(error.message);
  }

  async markAllAsRead(
    userClient: SupabaseClient,
    profileId: string,
    options: { type?: string; beforeItemId?: string } = {}
  ): Promise<void> {
    let query = adminSupabase
      .from('feed_items')
      .update({ read_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .is('read_at', null);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.beforeItemId) {
      const { data: beforeItem } = await adminSupabase
        .from('feed_items')
        .select('created_at')
        .eq('id', options.beforeItemId)
        .single();

      if (beforeItem) {
        query = query.lt('created_at', beforeItem.created_at);
      }
    }

    const { error } = await query;

    if (error) throw new Error(error.message);
  }

  async getUnreadCounts(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<{ total: number; byType: Record<string, number> }> {
    const { data: items, error } = await adminSupabase
      .from('feed_items')
      .select('type')
      .eq('profile_id', profileId)
      .is('read_at', null);

    if (error) throw new Error(error.message);

    const byType: Record<string, number> = {};
    let total = 0;

    items?.forEach((item) => {
      total++;
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    return { total, byType };
  }
}

export const feedService = new FeedService();
