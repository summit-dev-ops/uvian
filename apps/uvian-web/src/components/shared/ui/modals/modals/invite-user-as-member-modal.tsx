'use client';

import * as React from 'react';
import { InviteUserAsMemberDialog } from '../../dialogs';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import type { UserSearchParams } from '~/lib/domains/profile/types';

export interface InviteUserAsMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  defaultRole?: 'admin' | 'member';
  searchContext?: UserSearchParams['searchContext'];
}

export function InviteUserAsMemberModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
  defaultRole = 'member',
  searchContext,
}: InviteUserAsMemberModalProps) {
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (
    members: Array<{
      userId: string;
      profileId: string;
      displayName: string;
      role: 'admin' | 'member';
    }>
  ) => {
    try {
      await executeAction(onConfirmActionId, members);
      onOpenChange(false);
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
        console.error('Failed to cancel:', error);
      }
    }
  };

  return (
    <InviteUserAsMemberDialog
      open={open}
      onOpenChange={onOpenChange}
      defaultRole={defaultRole}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitPending={isLoading}
      searchContext={searchContext}
    />
  );
}
