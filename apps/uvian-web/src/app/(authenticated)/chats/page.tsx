'use client';

import React from 'react';
import Link from 'next/link';
import { useConversations } from '~/components/features/chat';
import { chatActions } from '~/lib/domains/chat/actions';
import { useAction } from '~/lib/hooks/use-action';
import { useProfile } from '~/components/features/user/hooks/use-profile';
import { ScrollArea, Button } from '@org/ui';

export default function ConversationsPage() {
  const { conversations, isLoading, error } = useConversations();
  const { profile } = useProfile();
  const { perform: createConversation, isPending: isCreating } = useAction(
    chatActions.createConversation()
  );

  const handleStartChatting = () => {
    if (!profile?.profileId) {
      console.error('Cannot create conversation: no profile found');
      return;
    }

    createConversation({
      id: crypto.randomUUID(),
      title: 'New Conversation',
      profileId: profile.profileId,
    });
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
        <h2 className="text-xl font-bold text-destructive">
          Error loading conversations
        </h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden flex-col">
      <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">Conversations</h1>
        </div>
        <Button size="sm" onClick={handleStartChatting} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'New Chat'}
        </Button>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 w-full rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">No conversations yet</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Start your first conversation with Uvian AI.
                </p>
              </div>
              <Button onClick={handleStartChatting} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Start Chatting'}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {conversations?.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chats/${conv.id}`}
                  className="group block p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {conv.title || 'Untitled Conversation'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
