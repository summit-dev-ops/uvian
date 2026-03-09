/**
 * Chat Domain Utilities
 *
 * Transformer functions and React Query cache update utilities.
 */

import { QueryClient } from '@tanstack/react-query';
import type { MessageUI } from './types';
import { chatKeys } from './api/keys';

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
      console.log({ message, isDelta });
      if (existingIndex !== -1) {
        if (isDelta) {
          // Update existing message with delta content
          return oldMessages.map((msg, idx) => {
            if (idx === existingIndex) {
              return {
                ...msg,
                content: msg.content + message.content,
                isStreaming: true,
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
// Message Coalescing Utilities
// ============================================================================

const COALESCE_TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Determines whether a message should display its full header (avatar, name, timestamp)
 * or be coalesced with the previous message.
 *
 * Returns true if the message should show a full header, false if it should be coalesced.
 * A message shows its header when:
 * - It's the first message in the conversation
 * - The sender is different from the previous message
 * - The time gap between messages exceeds the threshold
 */
export function shouldShowMessageHeader(
  currentMessage: MessageUI,
  previousMessage: MessageUI | undefined
): boolean {
  if (!previousMessage) return true;

  if (currentMessage.senderId !== previousMessage.senderId) return true;

  const currentTime = new Date(currentMessage.createdAt).getTime();
  const previousTime = new Date(previousMessage.createdAt).getTime();
  const timeDiff = currentTime - previousTime;

  return timeDiff > COALESCE_TIME_THRESHOLD_MS;
}

// ============================================================================
// Exported Utilities Object
// ============================================================================

export const chatUtils = {
  appendTokenToCache,
  finalizeStreamingMessage,
  addMessageToCache,
  shouldShowMessageHeader,
};
