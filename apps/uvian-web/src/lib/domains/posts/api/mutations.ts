/**
 * Posts Domain Mutations
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { postsKeys } from './keys';
import type { PostUI } from '../types';

export type CreatePostPayload = {
  id: string;
  spaceId: string;
  content: string;
  contentType?: 'text' | 'url';
  userId?: string;
};

export type DeletePostPayload = {
  postId: string;
};

type CreatePostContext = {
  previousPosts?: PostUI[];
};

export const postsMutations = {
  createPost: (
    queryClient: QueryClient
  ): MutationOptions<PostUI, Error, CreatePostPayload, CreatePostContext> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<PostUI>(
        `/api/spaces/${payload.spaceId}/posts`,
        {
          content: payload.content,
          contentType: payload.contentType || 'text',
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: postsKeys.posts(payload.spaceId),
      });

      const previousPosts = queryClient.getQueryData<PostUI[]>(
        postsKeys.posts(payload.spaceId)
      );

      const optimisticPost: PostUI = {
        id: payload.id,
        spaceId: payload.spaceId,
        userId: payload.userId || '',
        contentType: payload.contentType || 'text',
        content: payload.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PostUI[]>(
        postsKeys.posts(payload.spaceId),
        (old) => (old ? [optimisticPost, ...old] : [optimisticPost])
      );

      return { previousPosts };
    },

    onError: (_err, payload, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          postsKeys.posts(payload.spaceId),
          context.previousPosts
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
  }),

  deletePost: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, DeletePostPayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/posts/${payload.postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
  }),
};
