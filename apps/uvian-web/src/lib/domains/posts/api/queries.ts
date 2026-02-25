/**
 * Posts Domain Queries
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { postsKeys } from './keys';
import type { PostsResponse, PostUI } from '../types';

export const postsQueries = {
  spacePosts: (
    authProfileId: string | undefined,
    spaceId: string | undefined,
    options: { cursor?: string; limit?: number } = {}
  ) =>
    queryOptions({
      queryKey: postsKeys.posts(authProfileId, spaceId),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options.cursor) params.set('cursor', options.cursor);
        if (options.limit) params.set('limit', String(options.limit));

        const { data } = await apiClient.get<PostsResponse>(
          `/api/spaces/${spaceId}/posts?${params.toString()}`,
          { headers: { 'x-profile-id': authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId && !!spaceId,
      staleTime: 1000 * 60 * 2,
    }),

  post: (authProfileId: string | undefined, postId: string | undefined) =>
    queryOptions({
      queryKey: postsKeys.post(authProfileId, postId),
      queryFn: async () => {
        const { data } = await apiClient.get<PostUI>(`/api/posts/${postId}`, {
          headers: { 'x-profile-id': authProfileId },
        });
        return data;
      },
      enabled: !!authProfileId && !!postId,
      staleTime: 1000 * 60 * 5,
    }),
};
