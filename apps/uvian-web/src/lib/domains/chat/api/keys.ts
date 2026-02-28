/**
 * Chat Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (conversationId: string) =>
    [...chatKeys.all, 'conversation', conversationId] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  conversationMembers: (conversationId: string) =>
    [...chatKeys.all, 'conversation-members', conversationId] as const,
};
