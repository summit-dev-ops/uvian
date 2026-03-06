'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { notesMutations } from '~/lib/domains/notes/api';

export interface NoteDetailPageActionContextType {
  spaceId: string;
  noteId: string;
  readonly ACTION_DELETE_NOTE: 'delete-note';
}

interface NoteDetailPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  noteId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const NOTE_ACTION_IDS = {
  DELETE_NOTE: 'delete-note',
} as const;

export function NoteDetailPageActionProvider({
  children,
  spaceId,
  noteId,
  onError,
  onSuccess,
}: NoteDetailPageActionProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteNote } = useMutation(
    notesMutations.deleteNote(queryClient)
  );

  const handleDeleteNote = React.useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      deleteNote(
        {
          noteId,
          spaceId,
        },
        {
          onSuccess: () => {
            resolve();
            router.push(`/spaces/${spaceId}/notes`);
          },
          onError: (error) => reject(error),
        }
      );
    });
  }, [deleteNote, noteId, spaceId, router]);

  const actions: ActionRegistrationType[] = [
    {
      id: NOTE_ACTION_IDS.DELETE_NOTE,
      label: 'Delete Note',
      handler: handleDeleteNote,
      destructive: true,
      loadingLabel: 'Deleting...',
    },
  ];

  const handleActionSuccess = React.useCallback(
    (actionId: string) => {
      onSuccess?.(actionId);
    },
    [onSuccess]
  );

  const handleActionError = React.useCallback(
    (error: Error, actionId: string) => {
      console.error(`Action ${actionId} failed:`, error);
      onError?.(error, actionId);
    },
    [onError]
  );

  return (
    <NoteDetailPageActionContext.Provider
      value={{
        spaceId,
        noteId,
        ACTION_DELETE_NOTE: 'delete-note',
      }}
    >
      <PageActionProvider
        actions={actions}
        onActionError={handleActionError}
        onActionSuccess={handleActionSuccess}
      >
        {children}
      </PageActionProvider>
    </NoteDetailPageActionContext.Provider>
  );
}

const NoteDetailPageActionContext =
  React.createContext<NoteDetailPageActionContextType | null>(null);

export function useNoteDetailPageActionContext() {
  const context = React.useContext(NoteDetailPageActionContext);
  if (!context) {
    throw new Error(
      'useNoteDetailPageActionContext must be used within a NoteDetailPageActionProvider'
    );
  }
  return context;
}

export { NoteDetailPageActions } from './note-detail-page-actions';
