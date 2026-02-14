/**
 * Chat Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating conversations, sending messages, and deleting conversations.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { chatKeys } from './keys';
import type {
  ConversationUI,
  MessageUI,
  ConversationMemberUI,
  ConversationMemberRole,
} from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateConversationPayload = {
  authProfileId: string;
  id: string; // Client-generated ID
  title: string;
};

export type SendMessagePayload = {
  authProfileId: string;
  id: string; // Client-generated ID
  conversationId: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
};

export type DeleteConversationPayload = {
  authProfileId: string;
  conversationId: string;
};

export type InviteConversationMemberPayload = {
  authProfileId: string;
  conversationId: string;
  targetMemberProfileId: string;
  role: ConversationMemberRole;
};

export type RemoveConversationMemberPayload = {
  authProfileId: string;
  conversationId: string;
  targetMemberProfileId: string;
};

export type UpdateConversationMemberRolePayload = {
  authProfileId: string;
  conversationId: string;
  targetMemberProfileId: string;
  role: ConversationMemberRole;
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
      const { data } = await apiClient.post<ConversationUI>(
        `/api/conversations`,
        {
          id: payload.id,
          title: payload.title,
          profileId: payload.authProfileId,
        },
        { headers: { "x-profile-id": payload.authProfileId } }
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.conversations(payload.authProfileId),
      });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations(payload.authProfileId)
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
        chatKeys.conversations(payload.authProfileId),
        (old) =>
          old ? [...old, optimisticConversation] : [optimisticConversation]
      );

      return { previousConversations };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(_payload.authProfileId),
          context.previousConversations
        );
      }
    },

    onSuccess: (_, payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(payload.authProfileId),
      });
    },
  }),

  /**
   * Send a message in a conversation.
   */
  sendMessage: (
    queryClient: QueryClient
  ): MutationOptions<
    MessageUI,
    Error,
    SendMessagePayload,
    SendMessageContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<MessageUI>(
        `/api/conversations/${payload.conversationId}/messages`,
        {
          id: payload.id,
          senderId: payload.authProfileId,
          content: payload.content,
          role: payload.role || 'user',
        },
        {
          headers: { "x-profile-id": payload.authProfileId },
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(
          payload.authProfileId,
          payload.conversationId
        ),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<MessageUI[]>(
        chatKeys.messages(payload.authProfileId, payload.conversationId)
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
        senderId: payload.authProfileId || 'current-user', // Use actual profile ID or fallback
      };

      // Update cache with only the user message
      queryClient.setQueryData<MessageUI[]>(
        chatKeys.messages(payload.authProfileId, payload.conversationId),
        (old) =>
          old ? [...old, optimisticUserMessage] : [optimisticUserMessage]
      );

      return { previousMessages };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(_payload.authProfileId, _payload.conversationId),
          context.previousMessages
        );
      }
    },

    onSuccess: (_, _payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(
          _payload.authProfileId,
          _payload.conversationId
        ),
      });
    },
  }),

  /**
   * Delete a conversation.
   */
  deleteConversation: (
    queryClient: QueryClient
  ): MutationOptions<
    void,
    Error,
    DeleteConversationPayload,
    DeleteConversationContext
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/conversations/${payload.conversationId}`, {
        headers: { "x-profile-id": payload.authProfileId },
      });
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.conversations(payload.authProfileId),
      });

      // Snapshot previous conversations
      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations(payload.authProfileId)
      );

      // Optimistically remove from list
      queryClient.setQueryData<ConversationUI[]>(
        chatKeys.conversations(payload.authProfileId),
        (old) => old?.filter((conv) => conv.id !== payload.conversationId) || []
      );

      return { previousConversations };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(_payload.authProfileId),
          context.previousConversations
        );
      }
    },

    onSuccess: (_, payload) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(payload.authProfileId),
      });
      // Remove conversation-specific caches
      queryClient.removeQueries({
        queryKey: chatKeys.conversation(
          payload.authProfileId,
          payload.conversationId
        ),
      });
      queryClient.removeQueries({
        queryKey: chatKeys.messages(
          payload.authProfileId,
          payload.conversationId
        ),
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
      const { data } = await apiClient.post<ConversationMemberUI>(
        `/api/conversations/${payload.conversationId}/conversation-members/invite`,
        { profileId: payload.targetMemberProfileId, role: payload.role },
        { headers: { "x-profile-id": payload.authProfileId } }
      );
      return data;
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(
          payload.authProfileId,
          payload.conversationId
        ),
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
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.targetMemberProfileId}`,
        { headers: { "x-profile-id": payload.authProfileId } }
      );
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(
          payload.authProfileId,
          payload.conversationId
        ),
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
      const { data } = await apiClient.patch<ConversationMemberUI>(
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.targetMemberProfileId}/role`,
        { role: payload.role },
        { headers: { "x-profile-id": payload.authProfileId } }
      );
      return data;
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(
          payload.authProfileId,
          payload.conversationId
        ),
      });
    },
  }),
};
