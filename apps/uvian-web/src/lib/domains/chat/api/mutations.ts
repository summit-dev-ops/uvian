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
  Attachment,
} from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateConversationPayload = {
  id: string; // Client-generated ID
  title: string;
};

export type SendMessagePayload = {
  id: string; // Client-generated ID
  conversationId: string;
  content: string;
  role?: 'user' | 'assistant' | 'system';
  senderId?: string; // For optimistic updates
  attachments?: Attachment[];
};

export type DeleteConversationPayload = {
  conversationId: string;
};

export type InviteConversationMemberPayload = {
  conversationId: string;
  targetMemberUserId: string;
  role: ConversationMemberRole;
};

export type RemoveConversationMemberPayload = {
  conversationId: string;
  targetMemberUserId: string;
};

export type UpdateConversationMemberRolePayload = {
  conversationId: string;
  targetMemberUserId: string;
  role: ConversationMemberRole;
};

export type DeleteMessagePayload = {
  conversationId: string;
  messageId: string;
};

export type EditMessagePayload = {
  conversationId: string;
  messageId: string;
  content: string;
  attachments?: Attachment[];
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

type InviteConversationMemberContext = {
  previousMembers?: ConversationMemberUI[];
};

type RemoveConversationMemberContext = {
  previousMembers?: ConversationMemberUI[];
};

type DeleteMessageContext = {
  previousMessages?: MessageUI[];
};

type EditMessageContext = {
  previousMessages?: MessageUI[];
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
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.conversations(),
      });

      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations()
      );

      const optimisticConversation: ConversationUI = {
        id: payload.id,
        title: payload.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(),
          context.previousConversations
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
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
          content: payload.content,
          role: payload.role || 'user',
          attachments: payload.attachments,
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(payload.conversationId),
      });

      const previousMessages = queryClient.getQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId)
      );

      const optimisticUserMessage: MessageUI = {
        id: payload.id,
        conversationId: payload.conversationId,
        content: payload.content,
        role: payload.role || 'user',
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
        isStreaming: false,
        senderId: payload.senderId || '',
        attachments: payload.attachments,
      };

      queryClient.setQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId),
        (old) =>
          old ? [...old, optimisticUserMessage] : [optimisticUserMessage]
      );

      return { previousMessages };
    },

    onError: (_err, payload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(payload.conversationId),
          context.previousMessages
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
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
      await apiClient.delete(`/api/conversations/${payload.conversationId}`);
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.conversations(),
      });

      const previousConversations = queryClient.getQueryData<ConversationUI[]>(
        chatKeys.conversations()
      );

      queryClient.setQueryData<ConversationUI[]>(
        chatKeys.conversations(),
        (old) => old?.filter((conv) => conv.id !== payload.conversationId) || []
      );

      return { previousConversations };
    },

    onError: (_err, payload, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          chatKeys.conversations(),
          context.previousConversations
        );
      }
    },

    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
      queryClient.removeQueries({
        queryKey: chatKeys.conversation(payload.conversationId),
      });
      queryClient.removeQueries({
        queryKey: chatKeys.messages(payload.conversationId),
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
    InviteConversationMemberPayload,
    InviteConversationMemberContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ConversationMemberUI>(
        `/api/conversations/${payload.conversationId}/conversation-members/invite`,
        { userId: payload.targetMemberUserId, role: payload.role }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.conversationMembers(payload.conversationId),
      });

      const previousMembers = queryClient.getQueryData<ConversationMemberUI[]>(
        chatKeys.conversationMembers(payload.conversationId)
      );

      const optimisticMember: ConversationMemberUI = {
        userId: payload.targetMemberUserId,
        conversationId: payload.conversationId,
        role: payload.role,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      queryClient.setQueryData<ConversationMemberUI[]>(
        chatKeys.conversationMembers(payload.conversationId),
        (old) => (old ? [...old, optimisticMember] : [optimisticMember])
      );

      return { previousMembers };
    },

    onError: (_err, payload, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          chatKeys.conversationMembers(payload.conversationId),
          context.previousMembers
        );
      }
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
  ): MutationOptions<
    void,
    Error,
    RemoveConversationMemberPayload,
    RemoveConversationMemberContext
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.targetMemberUserId}`
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
      const { data } = await apiClient.patch<ConversationMemberUI>(
        `/api/conversations/${payload.conversationId}/conversation-members/${payload.targetMemberUserId}/role`,
        { role: payload.role }
      );
      return data;
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversationMembers(payload.conversationId),
      });
    },
  }),

  /**
   * Delete a message.
   */
  deleteMessage: (
    queryClient: QueryClient
  ): MutationOptions<
    void,
    Error,
    DeleteMessagePayload,
    DeleteMessageContext
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(
        `/api/conversations/${payload.conversationId}/messages/${payload.messageId}`
      );
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(payload.conversationId),
      });

      const previousMessages = queryClient.getQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId)
      );

      queryClient.setQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId),
        (old) => old?.filter((msg) => msg.id !== payload.messageId) || []
      );

      return { previousMessages };
    },
    onError: (_err, payload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(payload.conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
    },
  }),

  /**
   * Edit a message.
   */
  editMessage: (
    queryClient: QueryClient
  ): MutationOptions<
    MessageUI,
    Error,
    EditMessagePayload,
    EditMessageContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<MessageUI>(
        `/api/conversations/${payload.conversationId}/messages/${payload.messageId}`,
        { content: payload.content, attachments: payload.attachments }
      );
      return data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(payload.conversationId),
      });

      const previousMessages = queryClient.getQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId)
      );

      queryClient.setQueryData<MessageUI[]>(
        chatKeys.messages(payload.conversationId),
        (old) =>
          old?.map((msg) =>
            msg.id === payload.messageId
              ? {
                  ...msg,
                  content: payload.content,
                  attachments: payload.attachments ?? msg.attachments,
                  syncStatus: 'pending' as const,
                }
              : msg
          ) || []
      );

      return { previousMessages };
    },
    onError: (_err, payload, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(payload.conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
    },
  }),
};
