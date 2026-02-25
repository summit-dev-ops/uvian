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
  readonly ACTION_CREATE_SPACE: 'create-space';
  readonly ACTION_REFRESH_SPACES: 'refresh-spaces';
}

interface SpacesListPageActionProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SPACES_ACTION_IDS = {
  CREATE_SPACE: 'create-space',
  REFRESH_SPACES: 'refresh-spaces',
} as const;

export function SpacesListPageActionProvider({
  children,
  onError,
  onSuccess,
}: SpacesListPageActionProviderProps) {
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  const { mutate: createSpace } = useMutation(
    spacesMutations.createSpace(queryClient)
  );

  const handleSpaceCreation = React.useCallback(
    async (data: {
      name: string;
      description?: string;
      isPrivate: boolean;
    }) => {
      if (activeProfileId) {
        try {
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
      }
    },
    [createSpace, activeProfileId]
  );

  const handleRefreshSpaces = React.useCallback(async () => {
    queryClient.invalidateQueries({
      queryKey: spacesQueries.spaces(activeProfileId).queryKey,
    });
    queryClient.invalidateQueries({
      queryKey: spacesQueries.spaceStats(activeProfileId).queryKey,
    });
  }, [queryClient, activeProfileId]);

  const actions: ActionRegistrationType[] = [
    {
      id: SPACES_ACTION_IDS.CREATE_SPACE,
      label: 'Create Space',
      handler: handleSpaceCreation,
      loadingLabel: 'Creating...',
    },
    {
      id: SPACES_ACTION_IDS.REFRESH_SPACES,
      label: 'Refresh',
      handler: handleRefreshSpaces,
    },
  ];

  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
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
