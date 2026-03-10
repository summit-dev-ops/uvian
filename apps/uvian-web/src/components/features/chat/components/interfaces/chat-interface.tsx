'use client';

import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../hooks/use-chat';
import { useChatStore } from '../../hooks/use-chat-store';
import { useSocket } from '~/components/providers/socket/socket-provider';
import { useCurrentUser } from '~/components/features/user/hooks/use-current-user';
import { MessageRow } from '../message-row';
import { ChatInput } from '../chat-input';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import { chatUtils, shouldShowMessageHeader } from '~/lib/domains/chat/utils';
import type { SocketMessageEvent } from '~/lib/domains/chat/types';

// Import new layout components (will use InterfaceContent with scrollType="never")
import {
  InterfaceContainer,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import { ScrollArea } from '@org/ui';

export function ChatInterface({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { messages, sendMessage, isLoading } = useChat(conversationId);
  const { messageDraft, setMessageDraft, attachments, setAttachments } =
    useChatStore(conversationId);
  const { userId: currentUserId } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer =
        scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') ||
        scrollRef.current.firstChild;
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Join/Leave room logic
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId });
    }
  }, [socket, isConnected, conversationId]);

  // Listen for incoming messages from other users
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleNewMessage = (event: unknown) => {
      const e = event as SocketMessageEvent;
      // Only handle messages for this conversation
      if (e.conversationId !== conversationId) return;

      // Don't add our own messages - React Query already updated the cache
      if (e.message.senderId === currentUserId) return;

      // Add the new message to the React Query cache using the domain utility
      chatUtils.addMessageToCache(queryClient, conversationId, e.message);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, conversationId, currentUserId, queryClient]);
  const handleSend = () => {
    if (!messageDraft.trim() || !isConnected) return;
    const cleanedMessageDraft = messageDraft.replace(/&nbsp;/g, ' ').trim();

    sendMessage({
      id: crypto.randomUUID(),
      conversationId: conversationId,
      content: cleanedMessageDraft,
      role: 'user',
      senderId: currentUserId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setMessageDraft('');
    setAttachments([]);
  };

  return (
    <InterfaceContainer className="flex flex-col min-h-0 min-w-0 relative">
      <ScrollArea
        ref={scrollRef}
        className="flex-1 flex flex-col min-w-0 w-full  relative"
      >
        {isLoading && messages?.length === 0 ? (
          <InterfaceContent>
            <InterfaceLoading
              variant="default"
              message="Initializing chat..."
              size="full"
              className="flex items-center justify-center h-full"
            />
          </InterfaceContent>
        ) : (
          <div className="flex flex-col items-stretch flex-1 min-w-0 relative">
            {Array.isArray(messages) &&
              messages.map((msg, index) => {
                const prevMsg = index > 0 ? messages[index - 1] : undefined;
                const showHeaderFlag = shouldShowMessageHeader(msg, prevMsg);
                return (
                  <MessageRow
                    key={msg.id}
                    message={msg}
                    showHeader={showHeaderFlag}
                    onRetry={() => undefined}
                  />
                );
              })}
            {(!messages || messages.length === 0) && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center pt-24 space-y-4 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Welcome to Uvian AI</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start a conversation to see how I can help you with your
                    tasks today.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      <ChatInput
        context={{ conversationId }}
        value={messageDraft}
        onChange={setMessageDraft}
        onSend={handleSend}
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        disabled={!isConnected}
      />
    </InterfaceContainer>
  );
}
