'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@org/ui';
import { NoteForm, type NoteFormData } from '../forms/note-form';

export interface CreateNoteDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: unknown) => Promise<void>;
  cancelPending?: boolean;
  cancelError?: Error | null;
}

export function CreateNoteDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  submitError,
  onCancel,
  cancelPending,
  cancelError,
}: CreateNoteDialogProps) {
  const handleSubmit = async (data: NoteFormData) => {
    await onSubmit(data);
  };

  const handleCancel = async () => {
    if (onCancel) {
      await onCancel({});
    }
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {onOpenChange === undefined && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Create a new note in this space.
          </DialogDescription>
        </DialogHeader>
        <NoteForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitPending}
        />
      </DialogContent>
    </Dialog>
  );
}
