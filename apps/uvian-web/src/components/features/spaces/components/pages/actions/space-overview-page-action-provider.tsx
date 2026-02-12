'use client';

import * as React from 'react';
import { Edit, Users, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import { ActionRegistrationType, MODAL_IDS, PageActionProvider } from '~/components/shared/page-actions/page-action-context';


export interface SpaceOverviewPageActionContextType {
  spaceId: string;
  // Pre-defined action IDs for type safety
  readonly ACTION_EDIT_SPACE: 'edit-space';
  readonly ACTION_INVITE_PROFILES: 'invite-profiles';
  readonly ACTION_MANAGE_MEMBERS: 'manage-members';
  readonly ACTION_DELETE_SPACE: 'delete-space';
}

interface SpaceOverviewPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SPACE_ACTION_IDS = {
  EDIT_SPACE: 'edit-space',
  INVITE_PROFILES: 'invite-profiles',
  MANAGE_MEMBERS: 'manage-members',
  DELETE_SPACE: 'delete-space',
} as const;

export function SpaceOverviewPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceOverviewPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mutation for deleting spaces
  const { mutate: deleteSpace, isPending: isDeleting } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  // Handler for editing space
  const handleEditSpace = React.useCallback(async () => {
    try {
      router.push(`/spaces/${spaceId}/edit`);
    } catch (error) {
      console.error('Failed to navigate to edit space:', error);
      throw error;
    }
  }, [router, spaceId]);

  // Handler for inviting members
  const handleInviteMembers = React.useCallback(async () => {
    // This will be handled by opening the modal via UI component
    console.log('Opening invite members modal for space:', spaceId);
  }, [spaceId]);

  // Handler for managing members
  const handleManageMembers = React.useCallback(async () => {
    try {
      router.push(`/spaces/${spaceId}/members`);
    } catch (error) {
      console.error('Failed to navigate to manage members:', error);
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
      id: SPACE_ACTION_IDS.EDIT_SPACE,
      label: 'Edit Space',
      icon: Edit,
      handler: handleEditSpace,
    },
    {
      id: SPACE_ACTION_IDS.INVITE_PROFILES,
      label: 'Invite',
      icon: Users,
      handler: handleInviteMembers,
    },
    {
      id: SPACE_ACTION_IDS.MANAGE_MEMBERS,
      label: 'Manage Members',
      icon: Users,
      handler: handleManageMembers,
    },
    {
      id: SPACE_ACTION_IDS.DELETE_SPACE,
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
        [MODAL_IDS.INVITE_PROFILES]: {
          isOpen: false,
          props: {
            // PageModals will add open and onOpenChange
            // The actual onInvite handler will be provided by the UI component
          },
        },
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

export function useSpaceOverviewPageActionContext() {
  const context = React.useContext(
    React.createContext<SpaceOverviewPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSpaceOverviewPageActionContext must be used within a SpaceOverviewPageActionProvider'
    );
  }
  return context;
}
