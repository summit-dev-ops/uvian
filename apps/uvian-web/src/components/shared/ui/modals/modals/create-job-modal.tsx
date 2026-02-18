'use client';

import * as React from 'react';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import { CreateJobDialog } from '~/components/features/jobs/components/dialogs/create-job-dialog';

export interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
}

export function CreateJobModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
}: CreateJobModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: any) => {
    try {
      // Convert form data to the expected format for the action
      const actionData = {
        type: data.type,
        resourceScopeId: data.resourceScopeId,
        input: JSON.parse(data.input), // Parse JSON input for the action
      };

      await executeAction(onConfirmActionId, actionData);
    } catch (error) {
      console.error('Failed to create job:', error);
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
        console.error('Failed to cancel job creation:', error);
      }
    }
  };

  return (
    <CreateJobDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
