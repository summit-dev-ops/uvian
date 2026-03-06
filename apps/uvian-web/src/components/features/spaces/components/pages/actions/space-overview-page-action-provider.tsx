'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { spacesMutations } from '~/lib/domains/spaces/api/mutations';
import {
  postsMutations,
  type PostContentPayload,
} from '~/lib/domains/posts/api/mutations';
import { useCurrentUser } from '~/components/features/user/hooks/use-current-user';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

export interface SpaceOverviewPageActionContextType {
  spaceId: string;
  readonly ACTION_EDIT_SPACE: 'edit-space';
  readonly ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member';
  readonly ACTION_MANAGE_MEMBERS: 'manage-members';
  readonly ACTION_DELETE_SPACE: 'delete-space';
  readonly ACTION_CREATE_POST: 'create-post';
}

interface SpaceOverviewPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SPACE_ACTION_IDS = {
  EDIT_SPACE: 'edit-space',
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
  MANAGE_MEMBERS: 'manage-members',
  DELETE_SPACE: 'delete-space',
  CREATE_POST: 'create-post',
} as const;

export function SpaceOverviewPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceOverviewPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  // Mutation for deleting spaces
  const { mutate: deleteSpace } = useMutation(
    spacesMutations.deleteSpace(queryClient)
  );

  // Mutation for creating posts
  const { mutate: createPost } = useMutation(
    postsMutations.createPost(queryClient)
  );

  // Handler for creating post
  const handleCreatePost = React.useCallback(
    async (data: { spaceId: string; contents: PostContentPayload[] }) => {
      return new Promise<void>((resolve, reject) => {
        createPost(
          {
            id: crypto.randomUUID(),
            spaceId: data.spaceId,
            userId: userId || '',
            contents: data.contents,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    },
    [createPost]
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
      id: SPACE_ACTION_IDS.CREATE_POST,
      label: 'Create Post',
      handler: handleCreatePost,
    },
    {
      id: SPACE_ACTION_IDS.EDIT_SPACE,
      label: 'Edit Space',
      handler: handleEditSpace,
    },
    {
      id: SPACE_ACTION_IDS.INVITE_USER_AS_MEMBER,
      label: 'Invite',
      handler: handleInviteMembers,
    },
    {
      id: SPACE_ACTION_IDS.MANAGE_MEMBERS,
      label: 'Manage Members',
      handler: handleManageMembers,
    },
    {
      id: SPACE_ACTION_IDS.DELETE_SPACE,
      label: 'Delete Space',
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
    <SpaceOverviewPageActionContext.Provider
      value={{
        spaceId,
        ACTION_EDIT_SPACE: 'edit-space',
        ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member',
        ACTION_MANAGE_MEMBERS: 'manage-members',
        ACTION_DELETE_SPACE: 'delete-space',
        ACTION_CREATE_POST: 'create-post',
      }}
    >
      <PageActionProvider
        actions={actions}
        onActionError={handleActionError}
        onActionSuccess={handleActionSuccess}
      >
        {children}
      </PageActionProvider>
    </SpaceOverviewPageActionContext.Provider>
  );
}

const SpaceOverviewPageActionContext =
  React.createContext<SpaceOverviewPageActionContextType | null>(null);

export function useSpaceOverviewPageActionContext() {
  const context = React.useContext(SpaceOverviewPageActionContext);
  if (!context) {
    throw new Error(
      'useSpaceOverviewPageActionContext must be used within a SpaceOverviewPageActionProvider'
    );
  }
  return context;
}
