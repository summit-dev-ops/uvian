'use client';

import * as React from 'react';
import { CreateSpaceDialog } from '../../../../features/spaces/components/dialogs';
import { SpaceFormData } from '../../../../features/spaces/components/forms/space-form';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';

export interface CreateSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function CreateSpaceModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: CreateSpaceModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: SpaceFormData) => {
    try {
      await executeAction(onConfirmActionId, {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        coverUrl: data.coverUrl?.trim() || undefined,
        avatarUrl: data.avatarUrl?.trim() || undefined,
        isPrivate: data.isPrivate,
      });
    } catch (error) {
      console.error('Failed to create space:', error);
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
        console.error('Failed to cancel space creation:', error);
      }
    }
  };

  return (
    <CreateSpaceDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
