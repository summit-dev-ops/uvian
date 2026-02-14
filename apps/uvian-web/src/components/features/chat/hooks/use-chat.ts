'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '~/components/providers/socket/socket-provider';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatUtils } from '~/lib/domains/chat/utils';
import { useUserSessionStore } from '../../user/hooks/use-user-store';

export const useChat = (conversationId: string) => {
  const { activeProfileId } = useUserSessionStore();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // 1. Fetch messages using React Query
  const { data: messages, isLoading } = useQuery(
    chatQueries.messages(activeProfileId, conversationId)
  );

  // 3. Mutation for sending messages
  const { mutate: sendMessage, isPending: isSending } = useMutation(
    chatMutations.sendMessage(queryClient)
  );

  // 3. Socket Event Listeners for Real-time Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onNewMessage = (payload: any) => {
      console.log('New message received:', payload);
      chatUtils.addMessageToCache(
        queryClient,
        activeProfileId,
        payload.conversationId,
        payload.message,
        payload.isStreaming
      );

      if (!payload.isStreaming) {
        chatUtils.finalizeStreamingMessage(
          queryClient,
          activeProfileId,
          payload.conversationId,
          payload.message.id
        );
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, isConnected, queryClient, conversationId, activeProfileId]);

  return {
    messages,
    isLoading,
    sendMessage,
    isSending,
    isConnected,
  };
};
