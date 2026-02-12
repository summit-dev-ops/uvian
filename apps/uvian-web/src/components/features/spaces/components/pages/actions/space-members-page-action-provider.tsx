'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { ActionRegistrationType, MODAL_IDS, PageActionProvider } from '~/components/shared/page-actions/page-action-context';


export interface SpaceMembersPageActionContextType {
  spaceId: string;
  // Pre-defined action IDs for type safety
  readonly ACTION_INVITE_PROFILES: 'invite-profiles';
}

interface SpaceMembersPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const MEMBERS_ACTION_IDS = {
  INVITE_PROFILES: 'invite-profiles',
} as const;

export function SpaceMembersPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: SpaceMembersPageActionProviderProps) {
  // Handler for inviting members
  const handleInviteMembers = React.useCallback(async () => {
    // This will be handled by opening the modal via UI component
    console.log('Opening invite members modal for space:', spaceId);
  }, [spaceId]);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: MEMBERS_ACTION_IDS.INVITE_PROFILES,
      label: 'Invite',
      icon: UserPlus,
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
      initialModalState={{
        [MODAL_IDS.INVITE_PROFILES]: {
          isOpen: false,
          props: {
          },
        },
      }}
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
