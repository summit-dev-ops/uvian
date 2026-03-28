import { ServiceClients } from '../types';
import { PostScopedService, Post, PostContent, CreatePostInput } from './types';

export function createPostScopedService(
  clients: ServiceClients
): PostScopedService {
  return {
    async getPostsBySpace(
      spaceId: string,
      options: { limit?: number; cursor?: string } = {}
    ): Promise<{ items: Post[]; nextCursor: string | null; hasMore: boolean }> {
      const limit = options.limit || 20;

      let q = clients.userClient
        .schema('core_hub')
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

      const postIds = (items || []).map((item) => item.id);
      let contentsMap: Record<string, PostContent[]> = {};

      if (postIds.length > 0) {
        const { data: contents } = await clients.userClient
          .schema('core_hub')
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
    },

    async getPost(postId: string): Promise<Post> {
      const { data: post, error: postError } = await clients.userClient
        .schema('core_hub')
        .from('get_post_details')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError || !post) throw new Error('Post not found');

      const { data: contents } = await clients.userClient
        .schema('core_hub')
        .from('post_contents')
        .select('*')
        .eq('post_id', postId)
        .order('position', { ascending: true });

      const resolvedContents: PostContent[] = (contents || []).map(
        (content) => ({
          id: content.id,
          contentType: content.content_type,
          noteId: content.note_id,
          assetId: content.asset_id,
          url: content.url,
        })
      );

      return {
        id: post.id,
        spaceId: post.space_id,
        userId: post.author_id,
        contents: resolvedContents,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      };
    },

    async createPost(data: CreatePostInput): Promise<Post> {
      const { data: member } = await clients.userClient
        .schema('core_hub')
        .from('space_members')
        .select('id')
        .eq('space_id', data.spaceId)
        .eq('user_id', data.userId)
        .single();

      if (!member) throw new Error('Not a member of this space');

      const { data: post, error } = await clients.adminClient
        .schema('core_hub')
        .from('posts')
        .insert({
          id: data.id,
          space_id: data.spaceId,
          author_id: data.userId,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: post.id,
        spaceId: post.space_id,
        userId: post.author_id,
        contents: [],
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      };
    },

    async deletePost(
      postId: string,
      userId: string
    ): Promise<{ success: boolean }> {
      const { data: post, error: fetchError } = await clients.adminClient
        .schema('core_hub')
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

      await clients.adminClient
        .schema('core_hub')
        .from('post_contents')
        .delete()
        .eq('post_id', postId);

      const { error } = await clients.adminClient
        .schema('core_hub')
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw new Error(error.message);
      return { success: true };
    },
  };
}
