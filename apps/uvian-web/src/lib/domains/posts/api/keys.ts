/**
 * Posts Domain Query Key Factory
 */

export const postsKeys = {
  all: ['posts'] as const,
  posts: (profileId?: string, spaceId?: string) =>
    [...postsKeys.all, profileId, spaceId, 'list'] as const,
  post: (profileId?: string, postId?: string) =>
    [...postsKeys.all, profileId, 'post', postId] as const,
};
