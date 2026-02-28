import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

export class PostService {
  async getPostsBySpace(
    userClient: SupabaseClient,
    spaceId: string,
    options: { limit?: number; cursor?: string } = {}
  ) {
    const limit = options.limit || 20;

    let q = userClient
      .from('get_posts_for_space')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (options.cursor) {
      q = q.lt('id', options.cursor);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const hasMore = (data || []).length > limit;
    const items = hasMore ? data.slice(0, -1) : data;

    return {
      items: (items || []).map((row) => ({
        id: row.id,
        spaceId: row.space_id,
        userId: row.user_id,
        contentType: row.content_type,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  }

  async getPost(userClient: SupabaseClient, postId: string) {
    const { data, error } = await userClient
      .from('get_post_details')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !data) throw new Error('Post not found');

    return {
      id: data.id,
      spaceId: data.space_id,
      userId: data.user_id,
      contentType: data.content_type,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createPost(
    userClient: SupabaseClient,
    data: {
      spaceId: string;
      userId: string;
      contentType: 'text' | 'url';
      content: string;
    }
  ) {
    const { data: member } = await userClient
      .from('space_members')
      .select('id')
      .eq('space_id', data.spaceId)
      .eq('user_id', data.userId)
      .single();

    if (!member) throw new Error('Not a member of this space');

    const { data: post, error } = await adminSupabase
      .from('posts')
      .insert({
        space_id: data.spaceId,
        user_id: data.userId,
        content_type: data.contentType,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return post;
  }

  async deletePost(userClient: SupabaseClient, postId: string, userId: string) {
    const { data: post, error: fetchError } = await adminSupabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    if (post.user_id !== userId) {
      throw new Error("Cannot delete another user's post");
    }

    const { error } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}

export const postService = new PostService();
