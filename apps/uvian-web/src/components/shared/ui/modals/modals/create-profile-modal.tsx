'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import {
  ProfileForm,
  ProfileFormData,
} from '../../../../features/profiles/components/forms/profile-form';
export interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: ProfileFormData) => void;
  isLoading?: boolean;
}

export function CreateProfileModal({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}: CreateProfileModalProps) {
  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await onCreate(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Create New Profile
          </DialogTitle>
          <DialogDescription>
            Human or Agent?
          </DialogDescription>
        </DialogHeader>

        <ProfileForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          showCancel={false} // Modal provides its own cancel
        />
      </DialogContent>
    </Dialog>
  );
}
