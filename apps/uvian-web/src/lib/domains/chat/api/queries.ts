/**
 * Chat Domain Queries
 *
 * TanStack Query queryOptions for declarative fetching.
 * All queries apply transformers to convert API types to UI types.
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { chatKeys } from './keys';
import { chatUtils } from '../utils';
import type {
  ConversationAPI,
  MessageAPI,
  ConversationMemberAPI,
} from '../types';

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
        const { data } = await apiClient.get<ConversationAPI[]>(
          `/api/conversations`
        );
        return data.map(chatUtils.conversationApiToUi);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch a single conversation by ID.
   */
  conversation: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.conversation(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationAPI>(
          `/api/conversations/${conversationId}`
        );
        return chatUtils.conversationApiToUi(data);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all messages for a conversation.
   */
  messages: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.messages(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<MessageAPI[]>(
          `/api/conversations/${conversationId}/messages`
        );
        return data.map(chatUtils.messageApiToUi);
      },
      staleTime: 1000 * 60, // 1 minute
    }),
  /**
   * Fetch all members for a conversation.
   */
  conversationMembers: (conversationId: string) =>
    queryOptions({
      queryKey: chatKeys.conversationMembers(conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationMemberAPI[]>(
          `/api/conversations/${conversationId}/conversation-members`
        );
        return data.map(chatUtils.conversationMemberApiToUi);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
