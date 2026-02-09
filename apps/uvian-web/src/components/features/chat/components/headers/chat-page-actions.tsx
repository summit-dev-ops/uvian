'use client';

import * as React from 'react';
import { LogOut, Download, Trash2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { DropdownMenuItem, DropdownMenuSeparator } from '@org/ui';
import { ConfirmModal, ExportModal } from '../../../../modals';
import { useConversationMembers } from '../../hooks/use-conversation-members';
import { useProfile } from '../../../user';

interface ChatPageActionsProps {
  conversationId: string;
}

/**
 * Chat page-specific actions component
 * Injects chat-specific actions into the PageActions dropdown
 */
export function ChatPageActions({ conversationId }: ChatPageActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { isAdmin, removeMember } = useConversationMembers(conversationId);

  // Proper mutation for deleting conversations (replaces direct API call)
  const { mutate: deleteConversation, isPending: isDeleting } = useMutation(
    chatMutations.deleteConversation(queryClient, conversationId)
  );

  const handleLeave = async () => {
    if (!profile?.profileId) return;

    try {
      await removeMember(profile.profileId);
      router.push('/chats');
    } catch (error) {
      console.error('Failed to leave conversation:', error);
      throw error; // Re-throw to be handled by modal
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert('Only administrators can delete conversations.');
      return;
    }

    try {
      // Use proper mutation instead of direct API call
      await deleteConversation({ conversationId });
      router.push('/chats');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error; // Let modal handle the error
    }
  };

  return (
    <>
      {/* Chat-specific actions */}
      <DropdownMenuItem onClick={handleLeave} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Leave Conversation</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => setShowExportModal(true)}
        className="cursor-pointer"
      >
        <Download className="mr-2 h-4 w-4" />
        <span>Export Chat</span>
      </DropdownMenuItem>

      {/* Admin-only actions */}
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/chats/${conversationId}/members`)}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Manage Members</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Conversation</span>
            {isDeleting && (
              <span className="ml-2 text-xs text-muted-foreground">
                Deleting...
              </span>
            )}
          </DropdownMenuItem>
        </>
      )}

      {/* Modals */}
      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Conversation"
        description="This action cannot be undone. All messages will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        conversationId={conversationId}
      />
    </>
  );
}
