'use client';

import * as React from 'react';
import { Mail } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import { InviteMembersForm } from '~/components/features/spaces/components/forms/invite-members-form';

export type InviteMemberData = {
  email: string;
  role: 'admin' | 'member';
};

export interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (members: InviteMemberData[]) => void;
  isLoading?: boolean;
  defaultRole?: 'admin' | 'member';
}

export function InviteMembersModal({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
  defaultRole = 'member',
}: InviteMembersModalProps) {
  const handleSubmit = async (data: {
    invites: InviteMemberData[];
    bulkEmails?: string;
  }) => {
    try {
      await onInvite(data.invites);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Invite team members to this space. They will receive an email
            invitation.
          </DialogDescription>
        </DialogHeader>

        <InviteMembersForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          defaultRole={defaultRole}
          showCancel={false} // Modal provides its own cancel
        />
      </DialogContent>
    </Dialog>
  );
}
