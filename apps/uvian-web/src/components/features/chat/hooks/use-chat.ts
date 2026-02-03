'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '~/components/providers/socket/socket-provider';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatUtils } from '~/lib/domains/chat/utils';
import type { SocketMessageEvent } from '~/components/providers/socket/types';

export const useChat = (conversationId: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // 1. Fetch messages using React Query
  const { data: messages, isLoading } = useQuery(
    chatQueries.messages(conversationId)
  );

  // 2. Mutation for sending messages
  const { mutate: sendMessage, isPending: isSending } = useMutation(
    chatMutations.sendMessage(queryClient, conversationId)
  );

  // 3. Socket Event Listeners for Real-time Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onNewMessage = (payload: SocketMessageEvent) => {
      console.log('New message received:', payload);
      // payload.message is MessageAPI
      const messageUI = chatUtils.messageApiToUi(payload.message);
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
