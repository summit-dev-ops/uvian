/**
 * Chat Domain Query Key Factory
 *
 * Standardized query keys for cache management and invalidation.
 */

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
  conversationMembers: (conversationId: string) =>
    [...chatKeys.all, 'conversation-members', conversationId] as const,
};
