'use client';

import * as React from 'react';
import { InviteProfileDialog } from '../../dialogs';

export type InviteProfileData = {
  role: 'admin' | 'member';
  profileId: string;
};

export interface InviteProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  defaultRole?: 'admin' | 'member';
}

export function InviteProfileModal({
  open,
  onOpenChange,
  onConfirmActionId,
  onCancelActionId,
  defaultRole = 'member',
}: InviteProfileModalProps) {
  return <InviteProfileDialog open={open} onOpenChange={onOpenChange} />;
}
