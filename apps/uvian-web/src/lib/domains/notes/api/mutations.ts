/**
 * Notes Domain Mutations
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { notesKeys } from './keys';
import type { Attachment, NoteUI, NotesResponse } from '../types';

export type CreateNotePayload = {
  id?: string;
  spaceId: string;
  title: string;
  body?: string;
  attachments?: Attachment[];
};

export type UpdateNotePayload = {
  noteId: string;
  spaceId: string;
  title?: string;
  body?: string;
  attachments?: Attachment[];
};

export type DeleteNotePayload = {
  noteId: string;
  spaceId: string;
};

type CreateNoteContext = {
  previousNotes?: NotesResponse;
};

export const notesMutations = {
  createNote: (
    queryClient: QueryClient
  ): MutationOptions<NoteUI, Error, CreateNotePayload, CreateNoteContext> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<NoteUI>(
        `/api/spaces/${payload.spaceId}/notes`,
        {
          title: payload.title,
          body: payload.body || '',
          attachments: payload.attachments || [],
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: notesKeys.space(payload.spaceId),
      });

      const previousNotes = queryClient.getQueryData<NotesResponse>(
        notesKeys.space(payload.spaceId)
      );

      const optimisticNote: NoteUI = {
        id: payload.id || crypto.randomUUID(),
        spaceId: payload.spaceId,
        ownerUserId: '',
        title: payload.title,
        body: payload.body || null,
        attachments: payload.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NotesResponse>(
        notesKeys.space(payload.spaceId),
        (old) =>
          old
            ? { ...old, items: [optimisticNote, ...old.items] }
            : { items: [optimisticNote], nextCursor: null, hasMore: false }
      );

      return { previousNotes };
    },

    onError: (_err, payload, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(
          notesKeys.space(payload.spaceId),
          context.previousNotes
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
  }),

  updateNote: (
    queryClient: QueryClient
  ): MutationOptions<NoteUI, Error, UpdateNotePayload> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<NoteUI>(
        `/api/spaces/${payload.spaceId}/notes/${payload.noteId}`,
        {
          title: payload.title,
          body: payload.body,
          attachments: payload.attachments,
        }
      );
      return data;
    },

    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: notesKeys.space(payload.spaceId),
      });
      queryClient.invalidateQueries({
        queryKey: notesKeys.detail(payload.noteId),
      });
    },
  }),

  deleteNote: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, DeleteNotePayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(
        `/api/spaces/${payload.spaceId}/notes/${payload.noteId}`
      );
    },

    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({
        queryKey: notesKeys.space(payload.spaceId),
      });
      queryClient.removeQueries({ queryKey: notesKeys.detail(payload.noteId) });
    },
  }),
};
