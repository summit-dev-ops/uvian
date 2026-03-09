'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsQueries } from '~/lib/domains/posts/api/queries';
import { postsMutations } from '~/lib/domains/posts/api/mutations';
import type { PostUI } from '~/lib/domains/posts/types';
import { useProfilesByUserId } from '../../user/hooks/use-profiles-by-user';

export const useSpacePosts = (spaceId?: string) => {
  const { data, isLoading } = useQuery(postsQueries.spacePosts(spaceId || ''));

  const userIds = data?.items.map((p) => p.userId) ?? [];
  const { profiles, isLoading: isLoadingProfiles } =
    useProfilesByUserId(userIds);

  const posts: PostUI[] =
    data?.items.map((post) => ({
      ...post,
      authorProfile: profiles[post.userId],
    })) ?? [];

  return {
    posts,
    isLoading: isLoading || isLoadingProfiles,
  };
};

export const usePost = (postId?: string) => {
  const { data, isLoading, error } = useQuery(postsQueries.post(postId || ''));

  return {
    post: data,
    isLoading,
    error,
  };
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation(postsMutations.createPost(queryClient));
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation(postsMutations.deletePost(queryClient));
};
