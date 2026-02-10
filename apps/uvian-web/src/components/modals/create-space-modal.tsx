'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@org/ui';
import { SpaceForm } from '../features/spaces/components/forms/space-form';

export interface CreateSpaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => void;
  isLoading?: boolean;
}

export function CreateSpaceModal({
  open,
  onOpenChange,
  onCreate,
  isLoading = false,
}: CreateSpaceModalProps) {
  const handleSubmit = async (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    try {
      await onCreate({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        isPrivate: data.isPrivate,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Space
          </DialogTitle>
          <DialogDescription>
            Create a new space to organize conversations and collaborate with
            your team.
          </DialogDescription>
        </DialogHeader>

        <SpaceForm
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
