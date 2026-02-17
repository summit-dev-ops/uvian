'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { useConversationMembers } from '../../../hooks/use-conversation-members';

import {
  PageActionProvider,
  type ActionRegistrationType,
} from '../../../../../shared/ui/pages/page-actions/page-action-context';
import { useUserSessionStore } from '~/components/features/user/hooks/use-user-store';

export interface ChatPageActionContextType {
  conversationId: string;
  isAdmin: boolean;
  // Pre-defined action IDs for type safety
  readonly ACTION_LEAVE_CONVERSATION: 'leave-conversation';
  readonly ACTION_DELETE_CONVERSATION: 'delete-conversation';
  readonly ACTION_EXPORT_CHAT: 'export-chat';
  readonly ACTION_SHOW_MEMBERS: 'show-members';
}

interface ChatPageActionProviderProps {
  children: React.ReactNode;
  conversationId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const CHAT_ACTION_IDS = {
  LEAVE_CONVERSATION: 'leave-conversation',
  DELETE_CONVERSATION: 'delete-conversation',
  EXPORT_CHAT: 'export-chat',
  SHOW_MEMBERS: 'show-members',
} as const;

export function ChatPageActionProvider({
  children,
  conversationId,
  onError,
  onSuccess,
}: ChatPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfileId } = useUserSessionStore();
  const { role, removeMember } = useConversationMembers(conversationId);

  // Mutation for deleting conversations
  const { mutate: deleteConversation, isPending: isDeleting } = useMutation(
    chatMutations.deleteConversation(queryClient)
  );

  // Action handlers - these are the business logic that was in the original component
  const handleLeave = React.useCallback(async () => {
    if (activeProfileId)
      try {
        await removeMember(activeProfileId);
        router.push('/chats');
      } catch (error) {
        console.error('Failed to leave conversation:', error);
        throw error;
      }
  }, [activeProfileId, removeMember, router]);

  const handleDelete = React.useCallback(async () => {
    if ( !(role?.name ==="owner" || role?.name === "admin" )) {
      throw new Error('Only administrators can delete conversations.');
    }
    if (activeProfileId)
      try {
        await deleteConversation({
          authProfileId: activeProfileId,
          conversationId,
        });
        router.push('/chats');
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        throw error;
      }
  }, [role, deleteConversation, activeProfileId, conversationId, router]);

  const handleExport = React.useCallback(async () => {
    // Export action opens the export modal - actual export happens in the modal
    // This handler can be extended if needed for pre-export logic
    console.log('Export chat initiated for conversation:', conversationId);
  }, [conversationId]);

  const handleShowMembers = React.useCallback(async () => {
    router.push(`/chats/${conversationId}/members`);
  }, [conversationId, router]);

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
      disabled: !(role?.name ==="owner" || role?.name === "admin" )
    },
    {
      id: CHAT_ACTION_IDS.DELETE_CONVERSATION,
      label: 'Delete Conversation',
      handler: handleDelete,
      destructive: true,
      loadingLabel: 'Deleting...',
      disabled: !(role?.name ==="owner" || role?.name === "admin" )
    },
  ];

  return (
    <PageActionProvider
      actions={actions}
      onActionError={onError}
      onActionSuccess={onSuccess}
    >
      {children}
    </PageActionProvider>
  );
}
