'use client';

import * as React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { ActionRegistrationType, MODAL_IDS, PageActionProvider } from '~/components/shared/page-actions/page-action-context';


export interface SpaceEditPageActionContextType {
  spaceId: string;
  // Pre-defined action IDs for type safety
  readonly ACTION_CANCEL: 'cancel';
  readonly ACTION_DELETE_SPACE: 'delete-space';
}

interface SpaceEditPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const EDIT_ACTION_IDS = {
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

  // Mutation for deleting spaces
  const { mutate: deleteSpace, isPending: isDeleting } = useMutation(
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
    try {
      await deleteSpace({ spaceId });
      router.push('/spaces');
    } catch (error) {
      console.error('Failed to delete space:', error);
      throw error;
    }
  }, [deleteSpace, router, spaceId]);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: EDIT_ACTION_IDS.CANCEL,
      label: 'Cancel',
      icon: ArrowLeft,
      handler: handleCancel,
    },
    {
      id: EDIT_ACTION_IDS.DELETE_SPACE,
      label: 'Delete Space',
      icon: Trash2,
      handler: handleDeleteSpace,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
  ];

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

  return (
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
      initialModalState={{
        [MODAL_IDS.CONFIRM_DELETE]: {
          isOpen: false,
          props: {
            title: 'Delete Space',
            description:
              'This action cannot be undone. All conversations and messages will be permanently deleted.',
            confirmText: 'Delete',
            variant: 'destructive' as const,
            isLoading: isDeleting,
            onConfirm: handleDeleteSpace,
          },
        },
      }}
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
