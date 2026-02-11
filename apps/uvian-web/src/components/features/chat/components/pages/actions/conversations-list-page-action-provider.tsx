'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { userQueries } from '~/lib/domains/user/api/queries';
import { ActionRegistrationType, MODAL_IDS, PageActionProvider } from '~/components/shared/page-actions/page-action-context';


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
  const { data: profile } = useQuery(userQueries.profile());

  // Mutation for creating conversations with success/error handling
  const { mutate: createConversation, isPending: isCreating } = useMutation(
    chatMutations.createConversation(queryClient)
  );

  // Handler for creating a new conversation - called by the modal
  const handleConversationCreation = React.useCallback(
    async (title: string) => {
      if (!profile?.profileId) {
        throw new Error('Profile not found');
      }

      try {
        // Use the mutation which includes optimistic updates and navigation
        const newConversation = await createConversation({
          id: crypto.randomUUID(),
          title,
          profileId: profile.profileId,
        });

        // Return the new conversation data for navigation
        return newConversation;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        throw error;
      }
    },
    [profile?.profileId, createConversation]
  );

  // Handler for refresh action
  const handleRefreshConversations = React.useCallback(async () => {
    // Standard React Query approach - invalidate conversations query
    queryClient.invalidateQueries({
      queryKey: chatQueries.conversations().queryKey,
    });
  }, [queryClient]);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: LIST_ACTION_IDS.CREATE_CONVERSATION,
      label: 'New Conversation',
      icon: Plus,
      handler: handleRefreshConversations, // Placeholder - UI component handles modal opening
      loadingLabel: 'Creating...',
    },
    {
      id: LIST_ACTION_IDS.REFRESH_CONVERSATIONS,
      label: 'Refresh',
      icon: RefreshCw,
      handler: handleRefreshConversations,
    },
  ];

  // Success and error handlers for the PageActionProvider
  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);

      // Special handling for conversation creation success
      if (actionId === LIST_ACTION_IDS.CREATE_CONVERSATION) {
        // The UI component will handle modal opening and creation flow
        console.log('Create conversation action initiated');
      }
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
      initialModalState={{
        [MODAL_IDS.CREATE_CONVERSATION]: {
          isOpen: false,
          props: {
            // Core modal props required by CreateConversationModal
            onCreate: handleConversationCreation,
            isLoading: isCreating,
            // PageModals will automatically add open and onOpenChange props
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
