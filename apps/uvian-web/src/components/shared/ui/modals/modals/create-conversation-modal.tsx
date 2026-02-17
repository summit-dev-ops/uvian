'use client';

import * as React from 'react';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import { CreateConversationDialog } from '~/components/features/chat/components/dialogs';

export interface CreateConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function CreateConversationModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: CreateConversationModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: { title: string }) => {
    try {
      await executeAction(onConfirmActionId, data.title);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (!isLoading) {
      try {
        if (onCancelActionId) {
          await executeAction(onCancelActionId, {});
        }
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to cancel conversation creation:', error);
      }
    }
  };

  return (
    <CreateConversationDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
