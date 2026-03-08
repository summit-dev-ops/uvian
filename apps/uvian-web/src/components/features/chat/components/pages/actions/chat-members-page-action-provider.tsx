'use client';

import * as React from 'react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { useQueryClient } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { executeMutation } from '~/lib/api/utils';
import type { InviteConversationMemberPayload } from '~/lib/domains/chat/api/mutations';

export interface ChatMembersPageActionContextType {
  conversationId: string;
  readonly ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member';
}

interface ChatMembersPageActionProviderProps {
  children: React.ReactNode;
  conversationId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const ChatMembersPageActionContext =
  React.createContext<ChatMembersPageActionContextType | null>(null);

export const MEMBERS_ACTION_IDS = {
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
} as const;

export function ChatMembersPageActionProvider({
  children,
  conversationId,
  onError,
  onSuccess,
}: ChatMembersPageActionProviderProps) {
  const queryClient = useQueryClient();

  const contextValue = React.useMemo<ChatMembersPageActionContextType>(
    () => ({
      conversationId,
      ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member',
    }),
    [conversationId]
  );

  // Handler for inviting members - now actually makes API calls
  const handleInviteMember = React.useCallback(
    async (data: InviteConversationMemberPayload) => {
      console.log(
        '[ACTION_PROVIDER] handleInviteMember called with data:',
        data
      );

      await executeMutation(
        queryClient,
        chatMutations.inviteConversationMember(queryClient),
        data
      );

      console.log('[ACTION_PROVIDER] executeMutation completed successfully');
    },
    [queryClient]
  );

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: MEMBERS_ACTION_IDS.INVITE_USER_AS_MEMBER,
      label: 'Invite',
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
    <ChatMembersPageActionContext.Provider value={contextValue}>
      <PageActionProvider
        actions={actions}
        onActionError={handleActionError}
        onActionSuccess={handleActionSuccess}
      >
        {children}
      </PageActionProvider>
    </ChatMembersPageActionContext.Provider>
  );
}

export function useChatMembersPageActionContext() {
  const context = React.useContext(ChatMembersPageActionContext);
  if (!context) {
    throw new Error(
      'useChatMembersPageActionContext must be used within a ChatMembersPageActionProvider'
    );
  }
  return context;
}
