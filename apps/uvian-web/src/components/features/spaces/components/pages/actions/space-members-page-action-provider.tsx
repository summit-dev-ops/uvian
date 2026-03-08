'use client';

import * as React from 'react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  spacesMutations,
  type InviteSpaceMemberPayload,
} from '~/lib/domains/spaces/api/mutations';

export interface SpaceMembersPageActionContextType {
  spaceId: string;
  readonly ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member';
}

interface SpaceMembersPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const SpaceMembersPageActionContext =
  React.createContext<SpaceMembersPageActionContextType | null>(null);

const MEMBERS_ACTION_IDS = {
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
} as const;

export function SpaceMembersPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceMembersPageActionProviderProps) {
  const queryClient = useQueryClient();

  // Mutation for inviting space members
  const { mutate: inviteSpaceMember } = useMutation(
    spacesMutations.inviteSpaceMember(queryClient)
  );

  const contextValue = React.useMemo<SpaceMembersPageActionContextType>(
    () => ({
      spaceId,
      ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member',
    }),
    [spaceId]
  );

  const handleInviteMembers = React.useCallback(
    async (
      members: Array<{
        userId: string;
        profileId: string;
        displayName: string;
        role: 'admin' | 'member';
      }>
    ) => {
      console.log('[SPACE_MEMBERS_ACTION_PROVIDER] Inviting members:', members);

      const invitePromises = members.map((member) => {
        return new Promise<void>((resolve, reject) => {
          const payload: InviteSpaceMemberPayload = {
            spaceId,
            targetMemberUserId: member.userId,
            role: { name: member.role },
          };
          inviteSpaceMember(payload, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      });

      await Promise.all(invitePromises);
    },
    [spaceId, inviteSpaceMember]
  );

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: MEMBERS_ACTION_IDS.INVITE_USER_AS_MEMBER,
      label: 'Invite',
      handler: handleInviteMembers,
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
    <SpaceMembersPageActionContext.Provider value={contextValue}>
      <PageActionProvider
        actions={actions}
        onActionError={handleActionError}
        onActionSuccess={handleActionSuccess}
      >
        {children}
      </PageActionProvider>
    </SpaceMembersPageActionContext.Provider>
  );
}

export function useSpaceMembersPageActionContext() {
  const context = React.useContext(SpaceMembersPageActionContext);
  if (!context) {
    throw new Error(
      'useSpaceMembersPageActionContext must be used within a SpaceMembersPageActionProvider'
    );
  }
  return context;
}
