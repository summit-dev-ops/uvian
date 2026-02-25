'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsQueries } from '~/lib/domains/posts/api/queries';
import { postsMutations } from '~/lib/domains/posts/api/mutations';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

export const useSpacePosts = (spaceId?: string) => {
  const { activeProfileId } = useUserSessionStore();
  const { data, isLoading, error } = useQuery(
    postsQueries.spacePosts(activeProfileId || undefined, spaceId)
  );

  return {
    posts: data?.items || [],
    isLoading,
    error,
  };
};

export const usePost = (postId?: string) => {
  const { activeProfileId } = useUserSessionStore();
  const { data, isLoading, error } = useQuery(
    postsQueries.post(activeProfileId || undefined, postId)
  );

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
