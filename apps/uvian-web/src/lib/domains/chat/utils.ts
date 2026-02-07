/**
 * Chat Domain Utilities
 *
 * Transformer functions and React Query cache update utilities.
 */

import { QueryClient } from '@tanstack/react-query';
import type {
  MessageAPI,
  MessageUI,
  ConversationAPI,
  ConversationUI,
  ConversationMemberAPI,
  ConversationMemberUI,
} from './types';
import { chatKeys } from './api/keys';

// ============================================================================
// Transformers (API → UI)
// ============================================================================

export function messageApiToUi(raw: MessageAPI): MessageUI {
  return {
    id: raw.id,
    conversationId: raw.conversation_id,
    content: raw.content,
    role: raw.role,
    createdAt: new Date(raw.created_at),
    syncStatus: 'synced',
    isStreaming: false,
    tokens: [],
    senderId: raw.sender_id,
  };
}

export function conversationApiToUi(raw: ConversationAPI): ConversationUI {
  return {
    id: raw.id,
    title: raw.title,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    syncStatus: 'synced',
  };
}

export function conversationMemberApiToUi(
  raw: ConversationMemberAPI
): ConversationMemberUI {
  return {
    profileId: raw.profile_id,
    conversationId: raw.conversation_id,
    role: raw.role,
    createdAt: new Date(raw.created_at),
    syncStatus: 'synced',
  };
}

// ============================================================================
// Cache Update Utilities
// ============================================================================

/**
 * Append a streaming token to a message in the React Query cache.
 */
export function appendTokenToCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  token: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => {
      if (!oldMessages) return oldMessages;

      return oldMessages.map((msg) => {
        if (msg.id === messageId) {
          const tokens = msg.tokens || [];
          return {
            ...msg,
            tokens: [...tokens, token],
            content: msg.content + token,
            isStreaming: true,
          };
        }
        return msg;
      });
    }
  );
}

/**
 * Mark a streaming message as complete in the React Query cache.
 */
export function finalizeStreamingMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => {
      if (!oldMessages) return oldMessages;

      return oldMessages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isStreaming: false,
            syncStatus: 'synced' as const,
          };
        }
        return msg;
      });
    }
  );
}

/**
 * Add a new message to the messages cache for a conversation.
 */
export function addMessageToCache(
  queryClient: QueryClient,
  conversationId: string,
  message: MessageUI,
  isDelta = false
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(conversationId),
    (oldMessages) => {
      if (!oldMessages) return [message];

      // Check if message already exists
      const existingIndex = oldMessages.findIndex(
        (msg) => msg.id === message.id
      );

      if (existingIndex !== -1) {
        if (isDelta) {
          // Update existing message with delta content
          return oldMessages.map((msg, idx) => {
            if (idx === existingIndex) {
              return {
                ...msg,
                content: msg.content + message.content,
                isStreaming: true,
                syncStatus: 'synced', // Keeping it updated
              };
            }
            return msg;
          });
        }
        // If not delta and exists, don't add duplicate
        return oldMessages;
      }

      return [...oldMessages, message];
    }
  );
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export const chatUtils = {
  messageApiToUi,
  conversationApiToUi,
  conversationMemberApiToUi,
  appendTokenToCache,
  finalizeStreamingMessage,
  addMessageToCache,
};
