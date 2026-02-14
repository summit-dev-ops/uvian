'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { useConversationPreviews } from '~/components/features/chat/hooks/use-conversation-previews';

import type { PreviewData } from '~/lib/domains/chat/types';
import { ScrollArea } from '@org/ui';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

interface ConversationWithPreview {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  lastMessage?: PreviewData['lastMessage'];
  isLoadingPreview?: boolean;
}

export function ConversationsListInterface() {
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  // Fetch conversations
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery(chatQueries.conversations(activeProfileId));

  // Fetch latest message previews using useQueries
  const { previews } = useConversationPreviews(conversations || []);

  // Combine conversations with their preview data
  const conversationsWithPreviews = useMemo((): ConversationWithPreview[] => {
    if (!conversations) return [];

    return conversations.map((conv, index) => {
      const preview = previews[index];
      const isLoadingPreview = !preview;

      return {
        ...conv,
        lastMessage: preview?.lastMessage || null,
        isLoadingPreview,
      };
    });
  }, [conversations, previews]);

  // Create conversation mutation
  const { mutate: createConversation, isPending: isCreating } = useMutation(
    chatMutations.createConversation(queryClient)
  );

  const handleStartChatting = () => {
    const title = prompt('Enter conversation title:')?.trim();
    if (!title || !activeProfileId) return;

    createConversation({
      id: crypto.randomUUID(),
      title,
      authProfileId: activeProfileId,
    });
  };

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
        <h2 className="text-xl font-bold text-destructive">
          Error loading conversations
        </h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
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
        ) : conversationsWithPreviews?.length === 0 ? (
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
            <button
              onClick={handleStartChatting}
              disabled={isCreating}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Start Chatting'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversationsWithPreviews?.map((conv) => (
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
                    {conv.isLoadingPreview ? (
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    )}
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
  );
}
