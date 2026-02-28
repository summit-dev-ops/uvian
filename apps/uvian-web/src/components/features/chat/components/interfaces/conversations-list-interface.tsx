'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useConversationPreviews } from '~/components/features/chat/hooks/use-conversation-previews';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoadingSkeleton,
  InterfaceEmpty,
} from '~/components/shared/ui/interfaces';
import { Button, ItemGroup } from '@org/ui';
import { ConversationListItem } from '../conversation-list-item';

import type { PreviewData } from '~/lib/domains/chat/types';
import { chatMutations } from '~/lib/domains/chat/api';
import { CreateConversationDialog } from '../dialogs';

interface ConversationWithPreview {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastMessage?: PreviewData['lastMessage'];
  isLoadingPreview?: boolean;
}

export function ConversationsListInterface() {
  const queryClient = useQueryClient();
  // Fetch conversations
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery(chatQueries.conversations());
  // Fetch latest message previews using useQueries
  const { previews } = useConversationPreviews(conversations || []);

  // Create conversation mutation
  const {
    mutate: createConversation,
    isPending: isCreating,
    error: creationError,
  } = useMutation(chatMutations.createConversation(queryClient));

  const handleStartChatting = async (data: { title: string }) => {
    createConversation({
      id: crypto.randomUUID(),
      title: data.title,
    });
  };

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

  // Early return for error state
  if (error) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Conversations"
            subtitle="Error loading conversations"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Failed to Load Conversations"
            message={
              error.message ||
              'There was an error loading your conversations. Please try again.'
            }
            showRetry={true}
            showHome={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for loading state
  if (isLoading) {
    return (
      <InterfaceLayout>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Conversations"
            subtitle="Loading conversations..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <InterfaceLoadingSkeleton
                key={i}
                variant="card"
                lines={3}
                className="h-24"
              />
            ))}
          </div>
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for empty state
  if (conversationsWithPreviews?.length === 0) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Conversations"
            subtitle="No conversations yet"
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceEmpty
            variant="card"
            title="No conversations yet"
            message="Start your first conversation with Uvian AI."
            showIcon={true}
            action={
              <CreateConversationDialog
                onSubmit={handleStartChatting}
                submitPending={isCreating}
                submitError={creationError}
              >
                <Button>{'Start messaging...'}</Button>
              </CreateConversationDialog>
            }
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Conversations"
            subtitle={`${conversationsWithPreviews?.length || 0} conversations`}
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <ItemGroup>
            {conversationsWithPreviews?.map((conv) => (
              <ConversationListItem
                key={conv.id}
                id={conv.id}
                title={conv.title}
                createdAt={conv.createdAt}
                updatedAt={conv.updatedAt}
                syncStatus={conv.syncStatus}
                lastMessage={conv.lastMessage}
                isLoadingPreview={conv.isLoadingPreview}
              />
            ))}
          </ItemGroup>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
