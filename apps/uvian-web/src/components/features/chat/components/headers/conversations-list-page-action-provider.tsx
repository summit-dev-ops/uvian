'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useProfile } from '../../../user';

import {
  PageActionProvider,
  type ActionRegistrationType,
  MODAL_IDS,
} from '../../../../shared/page-actions/page-action-context';

export interface ConversationsListPageActionContextType {
  // Pre-defined action IDs for type safety
  readonly ACTION_CREATE_CONVERSATION: 'create-conversation';
  readonly ACTION_REFRESH_CONVERSATIONS: 'refresh-conversations';
}

interface ConversationsListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const LIST_ACTION_IDS = {
  CREATE_CONVERSATION: 'create-conversation',
  REFRESH_CONVERSATIONS: 'refresh-conversations',
} as const;

export function ConversationsListPageActionProvider({
  children,
  onError,
  onSuccess,
}: ConversationsListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  // Mutation for creating conversations
  const { mutate: createConversation, isPending: isCreating } = useMutation(
    chatMutations.createConversation(queryClient)
  );

  // Action handlers - these are the business logic that was in the original component
  const handleNewConversation = React.useCallback(async () => {
    // Open the create conversation modal
    // The actual creation happens in the modal's onCreate handler
    console.log('Opening create conversation modal');
  }, []);

  const handleRefresh = React.useCallback(async () => {
    // Standard React Query approach - invalidate conversations query
    queryClient.invalidateQueries({
      queryKey: chatQueries.conversations().queryKey,
    });
  }, [queryClient]);

  const handleCreateConversation = React.useCallback(
    async (title: string) => {
      if (!profile?.profileId) {
        throw new Error('Profile not found');
      }

      try {
        // Use the mutation which includes optimistic updates and navigation
        createConversation({
          id: crypto.randomUUID(),
          title,
          profileId: profile.profileId,
        });
      } catch (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      }
    },
    [profile?.profileId, createConversation]
  );

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: LIST_ACTION_IDS.CREATE_CONVERSATION,
      label: 'New Conversation',
      icon: Plus,
      handler: handleNewConversation,
      loadingLabel: 'Creating...',
    },
    {
      id: LIST_ACTION_IDS.REFRESH_CONVERSATIONS,
      label: 'Refresh',
      icon: RefreshCw,
      handler: handleRefresh,
    },
  ];

  return (
    <PageActionProvider
      actions={actions}
      onActionError={onError}
      onActionSuccess={onSuccess}
      initialModalState={{
        [MODAL_IDS.CREATE_CONVERSATION]: {
          isOpen: false,
          props: {
            onCreate: handleCreateConversation,
            isLoading: isCreating,
          },
        },
      }}
    >
      {children}
    </PageActionProvider>
  );
}

export function useConversationsListPageActionContext() {
  const context = React.useContext(
    React.createContext<ConversationsListPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useConversationsListPageActionContext must be used within a ConversationsListPageActionProvider'
    );
  }
  return context;
}
