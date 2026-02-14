/**
 * Chat Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const chatKeys = {
  all: ['chat'] as const,
  conversations: (profileId?: string) =>
    [...chatKeys.all, profileId, 'conversations'] as const,
  conversation: (profileId?: string, conversationId?: string) =>
    [...chatKeys.all, profileId, 'conversation', conversationId] as const,
  messages: (profileId?: string, conversationId?: string) =>
    [...chatKeys.all, profileId, 'messages', conversationId] as const,
  conversationMembers: (profileId?: string, conversationId?: string) =>
    [
      ...chatKeys.all,
      profileId,
      'conversation-members',
      conversationId,
    ] as const,
};
