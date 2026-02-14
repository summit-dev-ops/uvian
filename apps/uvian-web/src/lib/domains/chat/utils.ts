/**
 * Chat Domain Utilities
 *
 * Transformer functions and React Query cache update utilities.
 */

import { QueryClient } from '@tanstack/react-query';
import type {
  MessageUI,
} from './types';
import { chatKeys } from './api/keys';

// ============================================================================
// Cache Update Utilities
// ============================================================================

/**
 * Append a streaming token to a message in the React Query cache.
 */
export function appendTokenToCache(
  queryClient: QueryClient,
  profileId:string,
  conversationId: string,
  messageId: string,
  token: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(profileId, conversationId),
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
  profileId: string,
  conversationId: string,
  messageId: string
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(profileId, conversationId),
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
  profileId:string,
  conversationId: string,
  message: MessageUI,
  isDelta = false
): void {
  queryClient.setQueryData<MessageUI[]>(
    chatKeys.messages(profileId, conversationId),
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
  appendTokenToCache,
  finalizeStreamingMessage,
  addMessageToCache,
};
