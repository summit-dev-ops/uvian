'use client';

import * as React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { spacesQueries } from '~/lib/domains/spaces/api/queries';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

export interface SpacesListPageActionContextType {
  // Pre-defined action IDs for type safety
  readonly ACTION_CREATE_SPACE: 'create-space';
  readonly ACTION_REFRESH_SPACES: 'refresh-spaces';
  readonly ACTION_SHOW_SETTINGS: 'show-settings';
}

interface SpacesListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SPACES_ACTION_IDS = {
  CREATE_SPACE: 'create-space',
  REFRESH_SPACES: 'refresh-spaces',
  SHOW_SETTINGS: 'show-settings',
} as const;

export function SpacesListPageActionProvider({
  children,
  onError,
  onSuccess,
}: SpacesListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  // Mutation for creating spaces with success/error handling
  const { mutate: createSpace, isPending: isCreating } = useMutation(
    spacesMutations.createSpace(queryClient)
  );
  // Handler for creating a new space - called by the modal
  const handleSpaceCreation = React.useCallback(
    async (data: {
      name: string;
      description?: string;
      isPrivate: boolean;
    }) => {
      console.log(activeProfileId);
      if (activeProfileId)
        try {
          // Use the mutation which includes optimistic updates and navigation
          createSpace({
            authProfileId: activeProfileId,
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description,
            isPrivate: data.isPrivate,
          });
        } catch (error) {
          console.error('Failed to create space:', error);
          throw error;
        }
    },
    [createSpace, activeProfileId]
  );

  // Handler for refresh action
  const handleRefreshSpaces = React.useCallback(async () => {
    // Standard React Query approach - invalidate spaces queries
    queryClient.invalidateQueries({
      queryKey: spacesQueries.spaces(activeProfileId).queryKey,
    });
    queryClient.invalidateQueries({
      queryKey: spacesQueries.spaceStats(activeProfileId).queryKey,
    });
  }, [queryClient, activeProfileId]);

  // Handler for settings action
  const handleShowSettings = React.useCallback(async () => {
    // Navigate to settings page or open settings modals
    // Could navigate to a global settings page or open a settings modal
  }, []);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: SPACES_ACTION_IDS.CREATE_SPACE,
      label: 'Create Space',
      handler:handleSpaceCreation,
      loadingLabel: 'Creating...',
    },
    {
      id: SPACES_ACTION_IDS.REFRESH_SPACES,
      label: 'Refresh',
      handler: handleRefreshSpaces,
    },
    {
      id: SPACES_ACTION_IDS.SHOW_SETTINGS,
      label: 'Settings',
      handler: handleShowSettings,
    },
  ];

  // Success and error handlers for the PageActionProvider
  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);

      // Special handling for space creation success
      if (actionId === SPACES_ACTION_IDS.CREATE_SPACE) {
        console.log('Create space action initiated');
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
    >
      {children}
    </PageActionProvider>
  );
}

export function useSpacesListPageActionContext() {
  const context = React.useContext(
    React.createContext<SpacesListPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSpacesListPageActionContext must be used within a SpacesListPageActionProvider'
    );
  }
  return context;
}
