'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/use-chat';
import { useChatStore } from '../hooks/use-chat-store';
import { useSocket } from '~/components/providers/socket/socket-provider';
import { MessageRow } from './message-row';
import { ChatInput } from './chat-input';
import { ScrollArea } from '@org/ui';

export function ChatView({ conversationId }: { conversationId: string }) {
  const { socket, isConnected } = useSocket();
  const { messages, sendMessage, isLoading } = useChat(conversationId);
  const { messageDraft, setMessageDraft } = useChatStore(conversationId);
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

  const handleSend = () => {
    if (!messageDraft.trim() || !isConnected) return;

    sendMessage({
      id: crypto.randomUUID(),
      conversationId: conversationId,
      content: messageDraft,
      role: 'user',
    });

    setMessageDraft('');
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header/Status */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold">Uvian AI</h1>
            {!isConnected && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded animate-pulse">
                Disconnected
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">
              System Online
            </span>
          </div>
        </header>

        {/* Message List */}
        <ScrollArea ref={scrollRef} className="flex-1 pb-32">
          {isLoading && messages?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="animate-pulse">Initializing chat...</div>
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {messages?.map((msg) => (
                <MessageRow
                  key={msg.id}
                  message={msg}
                  onCopy={() => {}} // Could add a toast here later
                />
              ))}
              {messages?.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center pt-24 space-y-4 px-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Welcome to Uvian AI
                    </h2>
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

        {/* Floating Input Area */}
        <ChatInput
          value={messageDraft}
          onChange={setMessageDraft}
          onSend={handleSend}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
