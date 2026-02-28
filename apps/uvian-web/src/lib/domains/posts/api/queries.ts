/**
 * Posts Domain Queries
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { postsKeys } from './keys';
import type { PostsResponse, PostUI } from '../types';

export const postsQueries = {
  spacePosts: (
    spaceId: string,
    options: { cursor?: string; limit?: number } = {}
  ) =>
    queryOptions({
      queryKey: postsKeys.posts(spaceId),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options.cursor) params.set('cursor', options.cursor);
        if (options.limit) params.set('limit', String(options.limit));

        const { data } = await apiClient.get<PostsResponse>(
          `/api/spaces/${spaceId}/posts?${params.toString()}`
        );
        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 60 * 2,
    }),

  post: (postId: string) =>
    queryOptions({
      queryKey: postsKeys.post(postId),
      queryFn: async () => {
        const { data } = await apiClient.get<PostUI>(`/api/posts/${postId}`);
        return data;
      },
      enabled: !!postId,
      staleTime: 1000 * 60 * 5,
    }),
};
