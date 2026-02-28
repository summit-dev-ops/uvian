/**
 * Posts Domain Query Key Factory
 */

export const postsKeys = {
  all: ['posts'] as const,
  posts: (spaceId?: string) => [...postsKeys.all, spaceId, 'list'] as const,
  post: (postId?: string) => [...postsKeys.all, 'post', postId] as const,
};
