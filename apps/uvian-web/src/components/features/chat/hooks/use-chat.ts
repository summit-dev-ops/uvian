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
      if (activeProfileId) {
        chatUtils.addMessageToCache(
          queryClient,
          activeProfileId,
          payload.conversationId,
          payload.message,
          payload.isDelta
        );
        //42["new_message",{"message":{"id":"59d7d608-d2e4-4bcc-856a-2b16b149372e","conversationId":"a8bc96d5-0f65-4afa-bc7a-307c0d29585e","senderId":"7e9e45dc-0a09-466e-84c8-15fa087bb06d","content":" breath* Okay, I'm out of the","role":"assistant","createdAt":"2026-02-03T10:35:56Z","updatedAt":"2026-02-03T10:35:56Z"},"isDelta":true,"isComplete":false,"conversationId":"a8bc96d5-0f65-4afa-bc7a-307c0d29585e"}]
        if (payload.isComplete) {
          chatUtils.finalizeStreamingMessage(
            queryClient,
            activeProfileId,
            payload.conversationId,
            payload.message.id
          );
        }
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
