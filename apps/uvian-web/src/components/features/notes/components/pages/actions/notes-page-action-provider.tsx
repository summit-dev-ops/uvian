'use client';

import * as React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import {
  ActionRegistrationType,
  PageActionProvider,
} from '~/components/shared/ui/pages/page-actions/page-action-context';
import { notesMutations } from '~/lib/domains/notes/api';
import { useModalContext } from '~/components/shared/ui/modals';
import { MODAL_IDS } from '~/components/shared/ui/modals/modal-registry';
import { DropdownMenuItem } from '@org/ui';

export interface NotesPageActionContextType {
  spaceId: string;
  readonly ACTION_CREATE_NOTE: 'create-note';
  readonly ACTION_DELETE_NOTE: 'delete-note';
}

interface NotesPageActionProviderProps {
  children: React.ReactNode;
  spaceId: string;
  onError?: (error: Error, actionId: string) => void;
  onSuccess?: (actionId: string) => void;
}

const NOTE_ACTION_IDS = {
  CREATE_NOTE: 'create-note',
  DELETE_NOTE: 'delete-note',
} as const;

export function NotesPageActionProvider({
  children,
  spaceId,
  onError,
  onSuccess,
}: NotesPageActionProviderProps) {
  const queryClient = useQueryClient();

  const { mutate: deleteNote } = useMutation(
    notesMutations.deleteNote(queryClient)
  );

  const handleDeleteNote = React.useCallback(
    async (data: { noteId: string; spaceId: string }) => {
      return new Promise<void>((resolve, reject) => {
        deleteNote(
          {
            noteId: data.noteId,
            spaceId: data.spaceId,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });
    },
    [deleteNote]
  );

  const actions: ActionRegistrationType[] = [
    {
      id: NOTE_ACTION_IDS.CREATE_NOTE,
      label: 'Create Note',
      // Handler is not needed - action is handled via modal
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      handler: async () => {},
    },
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
    <PageActionProvider
      actions={actions}
      onActionError={handleActionError}
      onActionSuccess={handleActionSuccess}
    >
      {children}
    </PageActionProvider>
  );
}

export function useNotesPageActionContext() {
  const context = React.useContext(
    React.createContext<NotesPageActionContextType | null>(null)
  );
  if (!context) {
    throw new Error(
      'useNotesPageActionContext must be used within a NotesPageActionProvider'
    );
  }
  return context;
}

interface NotesPageActionsProps {
  spaceId: string;
}

export function NotesPageActions({ spaceId }: NotesPageActionsProps) {
  const modalContext = useModalContext();

  const handleCreateNote = React.useCallback(() => {
    modalContext.openModal(MODAL_IDS.CREATE_NOTE, {
      onConfirmActionId: NOTE_ACTION_IDS.CREATE_NOTE,
      spaceId,
    });
  }, [modalContext, spaceId]);

  return (
    <>
      <DropdownMenuItem onClick={handleCreateNote} className="cursor-pointer">
        <Plus className="mr-2 h-4 w-4" />
        <span>Create Note</span>
      </DropdownMenuItem>
    </>
  );
}
