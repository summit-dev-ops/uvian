/**
 * Posts Domain Mutations
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { postsKeys } from './keys';
import type { PostUI } from '../types';

export type CreatePostPayload = {
  authProfileId: string;
  spaceId: string;
  content: string;
  contentType?: 'text' | 'url';
};

export type DeletePostPayload = {
  authProfileId: string;
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
        },
        { headers: { 'x-profile-id': payload.authProfileId } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
    onError: (_err, _payload, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsKeys.posts(), context.previousPosts);
      }
    },
  }),

  deletePost: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, DeletePostPayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/posts/${payload.postId}`, {
        headers: { 'x-profile-id': payload.authProfileId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
  }),
};
