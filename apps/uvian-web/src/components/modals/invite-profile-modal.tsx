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
import { UserSearchInterface } from '../features/user/components/interfaces/user-search-interface';

export type InviteProfileData = {
  role: 'admin' | 'member';
  profileId: string;
};

export interface InviteProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (members: InviteProfileData[]) => void;
  isLoading?: boolean;
  defaultRole?: 'admin' | 'member';
}

export function InviteProfileModal({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
  defaultRole = 'member',
}: InviteProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite to your space
          </DialogTitle>
          <DialogDescription>
            Just search for the name of the profile you are interested in adding to this space.
          </DialogDescription>
        </DialogHeader>
        <UserSearchInterface


        />
      </DialogContent>
    </Dialog>
  );
}
