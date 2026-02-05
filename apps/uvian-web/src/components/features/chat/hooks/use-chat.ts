'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '~/components/providers/socket/socket-provider';
import { userQueries } from '~/lib/domains/user/api/queries';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatUtils } from '~/lib/domains/chat/utils';
import type { MessageAPI } from '~/lib/domains/chat/types';

export const useChat = (conversationId: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // 1. Fetch messages using React Query
  const { data: messages, isLoading } = useQuery(
    chatQueries.messages(conversationId)
  );

  // 2. Fetch current user's profile
  const { data: profile } = useQuery({
    ...userQueries.profile(),
    enabled: !!conversationId, // Only fetch profile if we have a conversation
  });

  // 3. Mutation for sending messages
  const { mutate: sendMessage, isPending: isSending } = useMutation(
    chatMutations.sendMessage(queryClient, conversationId, profile?.profileId)
  );

  // 3. Socket Event Listeners for Real-time Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onNewMessage = (payload: any) => {
      console.log('New message received:', payload);
      // Transform socket message to match MessageAPI format
      const messageAPI: MessageAPI = {
        id: payload.message.id,
        conversation_id: payload.conversationId,
        sender_id: payload.message.senderId || payload.message.sender_id,
        content: payload.message.content,
        role: payload.message.role,
        created_at: payload.message.createdAt || payload.message.created_at,
        updated_at: payload.message.updatedAt || payload.message.updated_at,
      };

      const messageUI = chatUtils.messageApiToUi(messageAPI);
      chatUtils.addMessageToCache(
        queryClient,
        payload.conversationId,
        messageUI,
        payload.isDelta
      );

      if (payload.isComplete) {
        chatUtils.finalizeStreamingMessage(
          queryClient,
          payload.conversationId,
          payload.message.id
        );
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, isConnected, queryClient, conversationId]);

  return {
    messages,
    isLoading,
    sendMessage,
    isSending,
    isConnected,
  };
};
