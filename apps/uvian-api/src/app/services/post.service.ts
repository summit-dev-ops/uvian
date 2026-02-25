import { adminSupabase } from '../clients/supabase.client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Post } from '../types/post.types';
import { feedService } from './feed.service';

export class PostService {
  async createPost(
    userClient: SupabaseClient,
    data: {
      spaceId: string;
      profileId: string;
      contentType: 'text' | 'url';
      content: string;
    }
  ): Promise<Post> {
    const { data: post, error } = await adminSupabase
      .from('posts')
      .insert({
        space_id: data.spaceId,
        profile_id: data.profileId,
        content_type: data.contentType,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Create feed items for space members
    feedService
      .createFeedItemsForPost(post.id, data.spaceId, data.profileId)
      .catch((err) => console.error('Failed to create feed items:', err));

    return {
      id: post.id,
      spaceId: post.space_id,
      profileId: post.profile_id,
      contentType: post.content_type,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }

  async getPostsBySpace(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string,
    options: { limit?: number; cursor?: string } = {}
  ): Promise<Post[]> {
    const limit = options.limit || 20;

    let query = adminSupabase
      .from('posts')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options.cursor) {
      const { data: cursorItem } = await adminSupabase
        .from('posts')
        .select('created_at')
        .eq('id', options.cursor)
        .single();

      if (cursorItem) {
        query = query.lt('created_at', cursorItem.created_at);
      }
    }

    const { data: posts, error } = await query;

    if (error) throw new Error(error.message);

    return posts.map((post) => ({
      id: post.id,
      spaceId: post.space_id,
      profileId: post.profile_id,
      contentType: post.content_type,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }));
  }

  async getPost(
    userClient: SupabaseClient,
    postId: string,
    profileId: string
  ): Promise<Post | null> {
    const { data: post, error } = await adminSupabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) return null;

    return {
      id: post.id,
      spaceId: post.space_id,
      profileId: post.profile_id,
      contentType: post.content_type,
      content: post.content,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }

  async deletePost(
    userClient: SupabaseClient,
    postId: string,
    profileId: string
  ): Promise<void> {
    const { data: post, error: fetchError } = await adminSupabase
      .from('posts')
      .select('profile_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    if (post.profile_id !== profileId) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    const { error } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error(error.message);
  }
}

export const postService = new PostService();
