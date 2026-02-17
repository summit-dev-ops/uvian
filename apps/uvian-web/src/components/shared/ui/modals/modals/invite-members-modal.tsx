'use client';

import * as React from 'react';
import { InviteMembersDialog } from '../../dialogs';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';

export type InviteMemberData = {
  email: string;
  role: 'admin' | 'member';
};

export interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  defaultRole?: 'admin' | 'member';
}

export function InviteMembersModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
  defaultRole = 'member',
}: InviteMembersModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: { invites: InviteMemberData[] }) => {
    try {
      await executeAction(onConfirmActionId, data.invites);
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  };

  const handleCancel = async () => {
    if (!isLoading) {
      try {
        if (onCancelActionId) {
          await executeAction(onCancelActionId, {});
        }
      } catch (error) {
        console.error('Failed to cancel member invitation:', error);
      }
    }
  };

  return (
    <InviteMembersDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitPending={isLoading}
      defaultRole={defaultRole}
    />
  );
}
