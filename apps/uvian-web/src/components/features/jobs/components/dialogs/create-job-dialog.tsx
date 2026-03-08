'use client';

import * as React from 'react';
import { Briefcase } from 'lucide-react';

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
import { CreateJobForm } from '../forms/create-job-form';

export interface CreateJobDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: any) => Promise<void>;
  cancelPending?: boolean;
  cancelError?: Error | null;
}

export function CreateJobDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  submitError,
  onCancel,
  cancelPending,
  cancelError,
}: CreateJobDialogProps) {
  const isMobile = useIsMobile();

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to create job:', error);
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
        console.error('Failed to cancel job creation:', error);
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
              <Briefcase className="h-5 w-5" />
              Create New Job
            </DrawerTitle>
            <DrawerDescription>
              Create a new job with the specified type and input data.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 overflow-y-auto flex-1">
            <CreateJobForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={submitPending}
              showCancel={false}
            />
            {submitError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mt-4">
                Failed to create job: {submitError.message}
              </div>
            )}
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Create New Job
          </DialogTitle>
          <DialogDescription>
            Create a new job with the specified type and input data.
          </DialogDescription>
        </DialogHeader>

        <CreateJobForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitPending}
          showCancel={false}
        />

        {submitError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            Failed to create job: {submitError.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
