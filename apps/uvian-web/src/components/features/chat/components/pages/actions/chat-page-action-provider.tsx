'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  chatMutations,
  type InviteConversationMemberPayload,
} from '~/lib/domains/chat/api/mutations';

import {
  PageActionProvider,
  type ActionRegistrationType,
} from '../../../../../shared/ui/pages/page-actions/page-action-context';

export interface ChatPageActionContextType {
  conversationId: string;
  isAdmin: boolean;
  // Pre-defined action IDs for type safety
  readonly ACTION_LEAVE_CONVERSATION: 'leave-conversation';
  readonly ACTION_DELETE_CONVERSATION: 'delete-conversation';
  readonly ACTION_EXPORT_CHAT: 'export-chat';
  readonly ACTION_SHOW_MEMBERS: 'show-members';
  readonly ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member';
}

interface ChatPageActionProviderProps {
  children: React.ReactNode;
  conversationId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const ChatPageActionContext =
  React.createContext<ChatPageActionContextType | null>(null);

const CHAT_ACTION_IDS = {
  LEAVE_CONVERSATION: 'leave-conversation',
  DELETE_CONVERSATION: 'delete-conversation',
  EXPORT_CHAT: 'export-chat',
  SHOW_MEMBERS: 'show-members',
  INVITE_USER_AS_MEMBER: 'invite-user-as-member',
} as const;

export function ChatPageActionProvider({
  children,
  conversationId,
  onError,
  onSuccess,
}: ChatPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Mutation for deleting conversations
  const { mutate: deleteConversation } = useMutation(
    chatMutations.deleteConversation(queryClient)
  );

  // Mutation for inviting conversation members
  const { mutate: inviteConversationMember } = useMutation(
    chatMutations.inviteConversationMember(queryClient)
  );

  const contextValue = React.useMemo<ChatPageActionContextType>(
    () => ({
      conversationId,
      isAdmin: false,
      ACTION_LEAVE_CONVERSATION: 'leave-conversation',
      ACTION_DELETE_CONVERSATION: 'delete-conversation',
      ACTION_EXPORT_CHAT: 'export-chat',
      ACTION_SHOW_MEMBERS: 'show-members',
      ACTION_INVITE_USER_AS_MEMBER: 'invite-user-as-member',
    }),
    [conversationId]
  );

  // Action handlers - these are the business logic that was in the original component
  const handleLeave = React.useCallback(async () => {
    router.push('/chats');
  }, [router]);

  const handleDelete = React.useCallback(async () => {
    throw new Error('Only administrators can delete conversations.');
  }, [deleteConversation, conversationId, router]);

  const handleExport = React.useCallback(async () => {
    // Export action opens the export modal - actual export happens in the modal
    // This handler can be extended if needed for pre-export logic
    console.log('Export chat initiated for conversation:', conversationId);
  }, [conversationId]);

  const handleShowMembers = React.useCallback(async () => {
    router.push(`/chats/${conversationId}/members`);
  }, [conversationId, router]);

  const handleInviteMember = React.useCallback(
    async (
      members: Array<{
        userId: string;
        profileId: string;
        displayName: string;
        role: 'admin' | 'member';
      }>
    ) => {
      console.log('[CHAT_PAGE_ACTION_PROVIDER] Inviting members:', members);

      const invitePromises = members.map((member) => {
        return new Promise<void>((resolve, reject) => {
          const payload: InviteConversationMemberPayload = {
            conversationId,
            targetMemberUserId: member.userId,
            role: { name: member.role },
          };
          inviteConversationMember(payload, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      });

      await Promise.all(invitePromises);
    },
    [conversationId, inviteConversationMember]
  );

  // Register the actions with the PageActionProvider
  const actions: ActionRegistrationType[] = [
    {
      id: CHAT_ACTION_IDS.LEAVE_CONVERSATION,
      label: 'Leave Conversation',
      handler: handleLeave,
      loadingLabel: 'Leaving...',
    },
    {
      id: CHAT_ACTION_IDS.EXPORT_CHAT,
      label: 'Export Chat',
      handler: handleExport,
    },
    {
      id: CHAT_ACTION_IDS.SHOW_MEMBERS,
      label: 'Manage Members',
      handler: handleShowMembers,
    },
    {
      id: CHAT_ACTION_IDS.DELETE_CONVERSATION,
      label: 'Delete Conversation',
      handler: handleDelete,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
    {
      id: CHAT_ACTION_IDS.INVITE_USER_AS_MEMBER,
      label: 'Invite Member',
      handler: handleInviteMember,
    },
  ];

  return (
    <ChatPageActionContext.Provider value={contextValue}>
      <PageActionProvider
        actions={actions}
        onActionError={onError}
        onActionSuccess={onSuccess}
      >
        {children}
      </PageActionProvider>
    </ChatPageActionContext.Provider>
  );
}

export function useChatPageActionContext() {
  const context = React.useContext(ChatPageActionContext);
  if (!context) {
    throw new Error(
      'useChatPageActionContext must be used within a ChatPageActionProvider'
    );
  }
  return context;
}
