'use client';

import * as React from 'react';
import { usePageActionContext } from '~/components/shared/ui/pages/page-actions/page-action-context';
import { CreateAgentDialog } from '~/components/features/agents/components/dialogs';

export interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function CreateAgentModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: CreateAgentModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    subscribed_events: string[];
  }) => {
    try {
      await executeAction(onConfirmActionId, data);
    } catch (error) {
      console.error('Failed to create agent:', error);
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
        console.error('Failed to cancel agent creation:', error);
      }
    }
  };

  return (
    <CreateAgentDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
