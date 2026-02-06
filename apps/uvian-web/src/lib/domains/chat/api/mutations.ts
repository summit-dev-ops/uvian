/**
 * Chat Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating conversations, sending messages, and deleting conversations.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { chatKeys } from './keys';
import { chatUtils } from '../utils';
import type {
  ConversationAPI,
  ConversationUI,
  MessageAPI,
  MessageUI,
  ConversationMemberAPI,
  ConversationMemberUI,
} from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateConversationPayload = {
  id: string; // Client-generated ID
  title: string;
  profileId: string; // Current user's profile ID
};

export type SendMessagePayload = {
  id: string; // Client-generated ID
  conversationId: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
};

export type DeleteConversationPayload = {
  conversationId: string;
};

export type InviteConversationMemberPayload = {
  conversationId: string;
  userId: string;
  role: any;
};

export type RemoveConversationMemberPayload = {
  conversationId: string;
  userId: string;
};

export type UpdateConversationMemberRolePayload = {
  conversationId: string;
  userId: string;
  role: any;
};

// ============================================================================
// Mutation Context Types
// ============================================================================

type CreateConversationContext = {
  previousConversations?: ConversationUI[];
};

type SendMessageContext = {
  previousMessages?: MessageUI[];
};

type DeleteConversationContext = {
  previousConversations?: ConversationUI[];
};

// ============================================================================
// Mutation Options
// ============================================================================

export const chatMutations = {
  /**
   * Create a new conversation.
   */
  createConversation: (
    queryClient: QueryClient
  ): MutationOptions<
    ConversationUI,
    Error,
    CreateConversationPayload,
    CreateConversationContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ConversationAPI>(
        `/api/conversations`,
        { id: payload.id, title: payload.title, profileId: payload.profileId }
      );
      return chatUtils.conversationApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.conversations() });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations()
      );

      // Optimistically update
      const optimisticConversation: ConversationUI = {
        id: payload.id,
        title: payload.title,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending',
      };

      queryClient.setQueryData<ConversationUI[]>(
        chatKeys.conversations(),
        (old) =>
          old ? [...old, optimisticConversation] : [optimisticConversation]
      );

      return { previousConversations };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(),
          context.previousConversations
        );
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  }),

  /**
   * Send a message in a conversation.
   */
  sendMessage: (
    queryClient: QueryClient,
    conversationId: string,
    profileId?: string
  ): MutationOptions<
    MessageUI,
    Error,
    SendMessagePayload,
    SendMessageContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<MessageAPI>(
        `/api/conversations/${payload.conversationId}/messages`,
        {
          id: payload.id,
          sender_id: profileId, // Add the required sender_id field
          content: payload.content,
          role: payload.role || 'user',
        }
      );
      return chatUtils.messageApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(conversationId),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<MessageUI[]>(
        chatKeys.messages(conversationId)
      );

      // Create optimistic user message
      const optimisticUserMessage: MessageUI = {
        id: payload.id,
        conversationId: payload.conversationId,
        content: payload.content,
        role: payload.role || 'user',
        createdAt: new Date(),
        syncStatus: 'pending',
        isStreaming: false,
        senderId: profileId || 'current-user', // Use actual profile ID or fallback
      };

      // Update cache with only the user message
      queryClient.setQueryData<MessageUI[]>(
        chatKeys.messages(conversationId),
        (old) =>
          old ? [...old, optimisticUserMessage] : [optimisticUserMessage]
      );

      return { previousMessages };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          context.previousMessages
        );
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId),
      });
    },
  }),

  /**
   * Delete a conversation.
   */
  deleteConversation: (
    queryClient: QueryClient,
    conversationId: string
  ): MutationOptions<
    void,
    Error,
    DeleteConversationPayload,
    DeleteConversationContext
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/conversations/${payload.conversationId}`);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: chatKeys.conversations() });

      // Snapshot previous conversations
      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations()
      );

      // Optimistically remove from list
      queryClient.setQueryData<ConversationUI[]>(
        chatKeys.conversations(),
        (old) => old?.filter((conv) => conv.id !== payload.conversationId) || []
      );

      return { previousConversations };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(),
          context.previousConversations
        );
      }
    },

    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      // Remove conversation-specific caches
      queryClient.removeQueries({
        queryKey: chatKeys.conversation(conversationId),
      });
      queryClient.removeQueries({
        queryKey: chatKeys.messages(conversationId),
      });
    },
  }),

  /**
   * Invite a member to a conversation.
   */
  inviteConversationMember: (
    queryClient: QueryClient
  ): MutationOptions<
    ConversationMemberUI,
    Error,
    InviteConversationMemberPayload
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ConversationMemberAPI>(
        `/api/conversations/${payload.conversationId}/conversation-members/invite`,
        { userId: payload.userId, role: payload.role }
      );
      return chatUtils.conversationMemberApiToUi(data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(payload.conversationId),
      });
    },
  }),

  /**
   * Remove a member from a conversation.
   */
  removeConversationMember: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, RemoveConversationMemberPayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.userId}`
      );
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(payload.conversationId),
      });
    },
  }),

  /**
   * Update a member's role.
   */
  updateConversationMemberRole: (
    queryClient: QueryClient
  ): MutationOptions<
    ConversationMemberUI,
    Error,
    UpdateConversationMemberRolePayload
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<ConversationMemberAPI>(
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.userId}/role`,
        { role: payload.role }
      );
      return chatUtils.conversationMemberApiToUi(data);
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(payload.conversationId),
      });
    },
  }),
};
