'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePageActionContext } from '../../pages/page-actions/page-action-context';
import { useQueryClient } from '@tanstack/react-query';
import { CreateNoteDialog } from '../../../../features/notes/components/dialogs';
import { notesKeys } from '~/lib/domains/notes/api';
import type { NoteFormData } from '../../../../features/notes/components/dialogs/create-note-dialog';

export interface CreateNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmActionId: string;
  onCancelActionId?: string;
  spaceId: string;
}

export function CreateNoteModal({
  open,
  onOpenChange,
  onConfirmActionId,
  spaceId,
}: CreateNoteModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { executeAction, isActionExecuting } = usePageActionContext();
  const isLoading = isActionExecuting(onConfirmActionId);

  const handleSubmit = async (data: NoteFormData) => {
    try {
      const noteId = crypto.randomUUID();

      queryClient.setQueryData(notesKeys.space(spaceId), (old: unknown) =>
        old
          ? {
              ...(old as object),
              items: [
                {
                  id: noteId,
                  spaceId,
                  ownerUserId: '',
                  title: data.title,
                  body: data.body || null,
                  attachments: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                ...(old as { items: unknown[] }).items,
              ],
            }
          : {
              items: [
                {
                  id: noteId,
                  spaceId,
                  ownerUserId: '',
                  title: data.title,
                  body: data.body || null,
                  attachments: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              nextCursor: null,
              hasMore: false,
            }
      );

      await executeAction(onConfirmActionId, {
        spaceId,
        title: data.title,
        body: data.body,
      });

      router.push(`/spaces/${spaceId}/notes/${noteId}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
    onOpenChange(false);
  };

  const handleCancel = async () => {
    onOpenChange(false);
  };

  return (
    <CreateNoteDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      submitPending={isLoading}
      onCancel={handleCancel}
    />
  );
}
