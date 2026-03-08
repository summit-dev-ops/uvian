'use client';

import * as React from 'react';
import { User } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  useIsMobile,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@org/ui';
import { ProfileForm, ProfileFormData } from '../forms/profile-form';

export interface CreateProfileDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: any) => Promise<void>;
  cancelPending?: boolean;
  cancelError?: Error | null;
}

export function CreateProfileDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  submitError,
  onCancel,
  cancelPending,
  cancelError,
}: CreateProfileDialogProps) {
  const isMobile = useIsMobile();

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
    onOpenChange?.(false);
  };

  const handleCancel = async () => {
    if (!submitPending) {
      try {
        if (onCancel) {
          await onCancel({});
        }
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to cancel profile creation:', error);
      }
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {open === undefined && (
          <DrawerTrigger asChild>{children}</DrawerTrigger>
        )}
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create New Profile
            </DrawerTitle>
            <DrawerDescription>Human or Agent?</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
            <ProfileForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={submitPending}
              showCancel={false}
            />
          </div>

          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={submitPending}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New Profile
          </DialogTitle>
          <DialogDescription>Human or Agent?</DialogDescription>
        </DialogHeader>

        <ProfileForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitPending}
          showCancel={false}
        />
      </DialogContent>
    </Dialog>
  );
}
