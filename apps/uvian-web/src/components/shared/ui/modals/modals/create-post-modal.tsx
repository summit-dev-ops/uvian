'use client';

import * as React from 'react';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import { CreatePostDialog } from '~/components/features/posts/components/dialogs';
import type { PostContentPayload } from '~/lib/domains/posts/api/mutations';

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

  const handleSubmit = async (data: { contents: PostContentPayload[] }) => {
    try {
      await executeAction(onConfirmActionId, {
        spaceId,
        contents: data.contents,
      });
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
      spaceId={spaceId}
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
