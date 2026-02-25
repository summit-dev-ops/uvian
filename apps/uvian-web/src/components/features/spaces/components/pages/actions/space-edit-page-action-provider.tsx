'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

export interface SpaceEditPageActionContextType {
  spaceId: string;
  readonly ACTION_CANCEL: 'cancel';
  readonly ACTION_DELETE_SPACE: 'delete-space';
}

interface SpaceEditPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

export const EDIT_ACTION_IDS = {
  CANCEL: 'cancel',
  DELETE_SPACE: 'delete-space',
} as const;

export function SpaceEditPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceEditPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();

  // Mutation for deleting spaces
  const { mutate: deleteSpace } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  // Handler for cancel (navigation back to overview)
  const handleCancel = React.useCallback(async () => {
    try {
      router.push(`/spaces/${spaceId}`);
    } catch (error) {
      console.error('Failed to navigate back to space overview:', error);
      throw error;
    }
  }, [router, spaceId]);

  // Handler for deleting space
  const handleDeleteSpace = React.useCallback(async () => {
    if (activeProfileId)
      try {
        await deleteSpace({ authProfileId: activeProfileId, spaceId });
        router.push('/spaces');
      } catch (error) {
        console.error('Failed to delete space:', error);
        throw error;
      }
  }, [deleteSpace, activeProfileId, router, spaceId]);

  // Success and error handlers for the PageActionProvider
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

  const actions: ActionRegistrationType[] = [
    {
      id: EDIT_ACTION_IDS.CANCEL,
      label: 'Cancel',
      handler: handleCancel,
    },
    {
      id: EDIT_ACTION_IDS.DELETE_SPACE,
      label: 'Delete Space',
      handler: handleDeleteSpace,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
  ];

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

export function useSpaceEditPageActionContext() {
  const context = React.useContext(
    React.createContext<SpaceEditPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSpaceEditPageActionContext must be used within a SpaceEditPageActionProvider'
    );
  }
  return context;
}
