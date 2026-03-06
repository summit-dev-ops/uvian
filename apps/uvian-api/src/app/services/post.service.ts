import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

interface PostContent {
  id: string;
  contentType: 'note' | 'asset' | 'external';
  noteId: string | null;
  assetId: string | null;
  url: string | null;
}

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

    // Fetch post_contents for all posts
    const postIds = (items || []).map((item) => item.id);
    let contentsMap: Record<string, PostContent[]> = {};

    if (postIds.length > 0) {
      const { data: contents } = await adminSupabase
        .from('post_contents')
        .select('*')
        .in('post_id', postIds)
        .order('position', { ascending: true });

      if (contents) {
        for (const content of contents) {
          if (!contentsMap[content.post_id]) {
            contentsMap[content.post_id] = [];
          }
          contentsMap[content.post_id].push({
            id: content.id,
            contentType: content.content_type,
            noteId: content.note_id,
            assetId: content.asset_id,
            url: content.url,
          });
        }
      }
    }

    const resolvedItems = (items || []).map((row) => ({
      id: row.id,
      spaceId: row.space_id,
      userId: row.author_id,
      contents: contentsMap[row.id] || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return {
      items: resolvedItems,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      hasMore,
    };
  }

  async getPost(userClient: SupabaseClient, postId: string) {
    const { data: post, error: postError } = await userClient
      .from('get_post_details')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) throw new Error('Post not found');

    // Fetch post_contents
    const { data: contents } = await adminSupabase
      .from('post_contents')
      .select('*')
      .eq('post_id', postId)
      .order('position', { ascending: true });

    const resolvedContents: PostContent[] = (contents || []).map((content) => ({
      id: content.id,
      contentType: content.content_type,
      noteId: content.note_id,
      assetId: content.asset_id,
      url: content.url,
    }));

    return {
      id: post.id,
      spaceId: post.space_id,
      userId: post.author_id,
      contents: resolvedContents,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }

  async createPost(
    userClient: SupabaseClient,
    data: {
      id?: string;
      spaceId: string;
      userId: string;
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
        id: data.id,
        space_id: data.spaceId,
        author_id: data.userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return post;
  }

  async deletePost(userClient: SupabaseClient, postId: string, userId: string) {
    const { data: post, error: fetchError } = await adminSupabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      throw new Error('Post not found');
    }

    if (post.author_id !== userId) {
      throw new Error("Cannot delete another user's post");
    }

    // Delete post_contents first (handled by CASCADE, but being explicit)
    await adminSupabase.from('post_contents').delete().eq('post_id', postId);

    const { error } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}

export const postService = new PostService();
