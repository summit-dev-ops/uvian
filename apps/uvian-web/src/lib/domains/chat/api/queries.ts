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
  conversations: (authProfileId: string | undefined) =>
    queryOptions({
      queryKey: chatKeys.conversations(authProfileId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationUI[]>(
          `/api/conversations`,
          { headers: { "x-profile-id": authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  /**
   * Fetch a single conversation by ID.
   */
  conversation: (authProfileId: string | undefined, conversationId?: string) =>
    queryOptions({
      queryKey: chatKeys.conversation(authProfileId, conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationUI>(
          `/api/conversations/${conversationId}`,
          { headers: { "x-profile-id": authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId && !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  /**
   * Fetch all messages for a conversation.
   */
  messages: (authProfileId: string | undefined, conversationId?: string) =>
    queryOptions({
      queryKey: chatKeys.messages(authProfileId, conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<MessageUI[]>(
          `/api/conversations/${conversationId}/messages`,
          { headers: { "x-profile-id": authProfileId } }
        );
        // Ensure we always return an array, even if API returns null/undefined
        return data;
      },
      enabled: !!authProfileId && !!conversationId,
      staleTime: 1000 * 60, // 1 minute
    }),
  /**
   * Fetch all members for a conversation.
   */
  conversationMembers: (authProfileId: string | undefined, conversationId?: string) =>
    queryOptions({
      queryKey: chatKeys.conversationMembers(authProfileId, conversationId),
      queryFn: async () => {
        const { data } = await apiClient.get<ConversationMemberUI[]>(
          `/api/conversations/${conversationId}/conversation-members`,
          { headers: { "x-profile-id": authProfileId } }
        );
        return data;
      },
      enabled: !!authProfileId && !!conversationId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
