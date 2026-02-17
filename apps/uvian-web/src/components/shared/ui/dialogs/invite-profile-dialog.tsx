'use client';

import * as React from 'react';
import { Mail } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@org/ui';
import { ProfileSearchInterface } from '../../../features/profiles/components/interfaces/profile-search-interface';

export interface InviteProfileDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InviteProfileDialog({
  children,
  open,
  onOpenChange,
}: InviteProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite to your space
          </DialogTitle>
          <DialogDescription>
            Just search for the name of the profile you are interested in adding
            to this space.
          </DialogDescription>
        </DialogHeader>
        <ProfileSearchInterface />
      </DialogContent>
    </Dialog>
  );
}
