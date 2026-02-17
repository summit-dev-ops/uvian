'use client';

import * as React from 'react';
import { ConfirmDialog } from '../../dialogs';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirmActionId: string;
  onCancelActionId?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirmActionId,
  onCancelActionId,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleConfirm = async () => {
    try {
      await executeAction(onConfirmActionId, {});
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = async () => {
    if (!isLoading) {
      try {
        if (onCancelActionId) {
          await executeAction(onCancelActionId, {});
        }
      } catch (error) {
        console.error('Failed to cancel action confirmation:', error);
      }
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );
}
