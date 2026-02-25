'use client';

import * as React from 'react';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import { CreatePostDialog } from '~/components/features/posts/components/dialogs';

export interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  spaceId: string;
}

export function CreatePostModal({
  open,
  onOpenChange,
  onConfirmActionId,
  spaceId,
}: CreatePostModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: { content: string }) => {
    try {
      await executeAction(onConfirmActionId, { spaceId, ...data });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
    onOpenChange(false);
  };

  const handleCancel = async () => {
    onOpenChange(false);
  };

  return (
    <CreatePostDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
