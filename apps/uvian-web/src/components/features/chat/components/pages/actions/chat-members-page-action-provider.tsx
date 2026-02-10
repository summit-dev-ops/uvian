'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import {
  ActionRegistrationType,
  MODAL_IDS,
  PageActionProvider,
} from '~/components/shared/page-actions/page-action-context';

export interface ChatMembersPageActionContextType {
  conversationId: string;
  readonly ACTION_INVITE_MEMBER: 'invite-member';
}

interface ChatMembersPageActionProviderProps {
  children: React.ReactNode;
  conversationId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const MEMBERS_ACTION_IDS = {
  INVITE_MEMBER: 'invite-member',
} as const;

export function ChatMembersPageActionProvider({
  children,
  conversationId,
  onError,
  onSuccess,
}: ChatMembersPageActionProviderProps) {
  // Handler for inviting members
  const handleInviteMember = React.useCallback(async () => {
    // This will be handled by opening the modal via UI component
    console.log(
      'Opening invite member modal for conversation:',
      conversationId
    );
  }, [conversationId]);

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: MEMBERS_ACTION_IDS.INVITE_MEMBER,
      label: 'Invite Member',
      icon: UserPlus,
      handler: handleInviteMember,
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
        [MODAL_IDS.INVITE_MEMBERS]: {
          isOpen: false,
          props: {
            // PageModals will add open and onOpenChange
          },
        },
      }}
    >
      {children}
    </PageActionProvider>
  );
}

export function useChatMembersPageActionContext() {
  const context = React.useContext(
    React.createContext<ChatMembersPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useChatMembersPageActionContext must be used within a ChatMembersPageActionProvider'
    );
  }
  return context;
}
