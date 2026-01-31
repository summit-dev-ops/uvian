"use client"
import { useCallback } from 'react';
import { useSocket } from './socket-provider';
import type { JoinConversationPayload, SendMessagePayload, NewMessagePayload } from './types';


export const useChatSocket = () => {
  const { socket, isConnected } = useSocket();

  const joinConversation = useCallback(
    (payload: JoinConversationPayload) => {
      if (!socket) return;
      console.log("Emitting join_conversation", payload); // Add debug log
      socket.emit('join_conversation', payload);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload) => {
      if (!socket) return;
      socket.emit('send_message', payload);
    },
    [socket]
  );

  const onNewMessage = useCallback(
    (handler: (payload: NewMessagePayload) => void) => {
      if (!socket) return () => {}; // Return no-op if no socket
      
      socket.on('new_message', handler);
      return () => {
        socket.off('new_message', handler);
      };
    },
    [socket]
  );

  return { joinConversation, sendMessage, onNewMessage, isConnected };
};