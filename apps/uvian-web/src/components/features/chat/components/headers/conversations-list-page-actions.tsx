'use client';

import * as React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { chatMutations } from '~/lib/domains/chat/api/mutations';
import { chatQueries } from '~/lib/domains/chat/api/queries';
import { useProfile } from '../../../user';
import { DropdownMenuItem } from '@org/ui';
import { CreateConversationModal } from '../../../../modals';

/**
 * Conversations list page-specific actions component
 * Injects conversations list-specific actions into the PageActions dropdown
 */
export function ConversationsListPageActions() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Mutation for creating conversations
  const { mutate: createConversation, isPending: isCreating } = useMutation(
    chatMutations.createConversation(queryClient)
  );

  const handleNewConversation = () => {
    setShowCreateModal(true);
  };

  const handleCreateConversation = async (title: string) => {
    if (!profile?.profileId) return;

    try {
      // Use the mutation which includes optimistic updates and navigation
      createConversation({
        id: crypto.randomUUID(),
        title,
        profileId: profile.profileId,
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // TODO: Add toast notification for errors
    }
  };

  const handleRefresh = () => {
    // Standard React Query approach - invalidate conversations query
    queryClient.invalidateQueries({
      queryKey: chatQueries.conversations().queryKey,
    });
  };
  return (
    <>
      <DropdownMenuItem
        onClick={handleNewConversation}
        disabled={isCreating}
        className="cursor-pointer"
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>New Conversation</span>
        {isCreating && (
          <span className="ml-2 text-xs text-muted-foreground">
            Creating...
          </span>
        )}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer">
        <RefreshCw className="mr-2 h-4 w-4" />
        <span>Refresh</span>
      </DropdownMenuItem>

      {/* Create Conversation Modal */}
      <CreateConversationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreateConversation}
        isLoading={isCreating}
      />
    </>
  );
}
