'use client';

import * as React from 'react';
import { CreateProfileDialog } from '../../../../features/profiles/components/dialogs';
import { ProfileFormData } from '../../../../features/profiles/components/forms/profile-form';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';

export interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function CreateProfileModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: CreateProfileModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await executeAction(onConfirmActionId, data);
    } catch (error) {
      console.error('Failed to create profile:', error);
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
        console.error('Failed to cancel profile creation:', error);
      }
    }
  };

  return (
    <CreateProfileDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
