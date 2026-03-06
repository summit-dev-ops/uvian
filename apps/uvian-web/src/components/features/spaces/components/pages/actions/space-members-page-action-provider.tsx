'use client';

import * as React from 'react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';

export interface SpaceMembersPageActionContextType {
  spaceId: string;
  // Pre-defined action IDs for type safety
  readonly ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member';
}

interface SpaceMembersPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const MEMBERS_ACTION_IDS = {
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
} as const;

export function SpaceMembersPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceMembersPageActionProviderProps) {
  const handleInviteMembers = React.useCallback(async () => {
    console.log('Opening invite members modal for space:', spaceId);
  }, [spaceId]);

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
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useSpaceMembersPageActionContext() {
  const context = React.useContext(
    React.createContext<SpaceMembersPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useSpaceMembersPageActionContext must be used within a SpaceMembersPageActionProvider'
    );
  }
  return context;
}
