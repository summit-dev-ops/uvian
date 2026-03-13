/**
 * Chat Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { chatKeys } from './keys';
import { ConversationMemberUI, ConversationUI, MessageUI } from '../types';

// ============================================================================
// Query Options
// ============================================================================

export const chatQueries = {
  /**
   * Fetch all conversations.
   */
  conversations: () =>
    queryOptions({
      queryKey: chatKeys.conversations(),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationUI[]>(
          `/api/conversations`
        );
        return data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch a single conversation by ID.
   */
  conversation: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.conversation(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationUI>(
          `/api/conversations/${conversationId}`
        );
        return data;
      },
      enabled: !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all messages for a conversation.
   */
  messages: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.messages(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<MessageUI[]>(
          `/api/conversations/${conversationId}/messages`
        );
        return data
      },
      enabled: !!conversationId,
      staleTime: 1000 * 60, // 1 minute
    }),
  /**
   * Fetch all members for a conversation.
   */
  conversationMembers: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.conversationMembers(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationMemberUI[]>(
          `/api/conversations/${conversationId}/conversation-members`
        );
        return data;
      },
      enabled: !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
