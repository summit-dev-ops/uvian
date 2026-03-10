'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, DrawerContent, DrawerTitle, useIsMobile } from '@org/ui';
import { useCurrentUser } from '~/components/features/user/hooks/use-current-user';
import { ConfirmDialog } from '~/components/shared/ui/dialogs/confirm-dialog';
import { chatMutations } from '~/lib/domains/chat/api';
import type { MessageUI, Attachment } from '~/lib/domains/chat/types';
import { MessageActionsView, MessageEditView } from './views';

type MessageSelectionView = 'actions' | 'edit';

export interface MessageSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageUI;
  onRetry?: () => void;
}

export function MessageSelectionModal({
  open,
  onOpenChange,
  message,
  onRetry,
}: MessageSelectionModalProps) {
  const isMobile = useIsMobile();
  const { userId: currentUserId } = useCurrentUser();
  const queryClient = useQueryClient();

  const isAI = message.role === 'assistant';
  const isOwnMessage = message.senderProfile?.userId === currentUserId;

  const [view, setView] = React.useState<MessageSelectionView>('actions');
  const [editContent, setEditContent] = React.useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setView('actions');
      setEditContent(message.content);
      setShowDeleteConfirm(false);
    }
  }, [open, message.content]);

  const deleteMutation = useMutation({
    ...chatMutations.deleteMessage(queryClient),
  });

  const editMutation = useMutation({
    ...chatMutations.editMessage(queryClient),
  });

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({
        conversationId: message.conversationId,
        messageId: message.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleEditSave = async (
    newContent: string,
    newAttachments?: Attachment[]
  ) => {
    if (!newContent.trim()) return;

    try {
      await editMutation.mutateAsync({
        conversationId: message.conversationId,
        messageId: message.id,
        content: newContent.trim(),
        attachments: newAttachments,
      });
      setView('actions');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleEditContentChange = (content: string) => {
    setEditContent(content);
  };

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerTitle className="sr-only">Message options</DrawerTitle>
            <div className="p-4 pb-8">
              {view === 'actions' && (
                <MessageActionsView
                  message={message}
                  isOwnMessage={isOwnMessage}
                  isAI={isAI}
                  onRetry={onRetry}
                  onEdit={() => setView('edit')}
                  onDelete={handleDelete}
                  onClose={() => onOpenChange(false)}
                />
              )}
              {view === 'edit' && (
                <MessageEditView
                  message={message}
                  editContent={editContent}
                  onEditContentChange={handleEditContentChange}
                  onSave={handleEditSave}
                  onCancel={() => setView('actions')}
                  isSaving={editMutation.isPending}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete message?"
          description="This action cannot be undone."
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          isLoading={deleteMutation.isPending}
        />
      </>
    );
  }

  return null;
}
