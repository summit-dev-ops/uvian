/**
 * Notes Domain Queries
 */

import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { notesKeys } from './keys';
import type { NotesResponse, NoteUI } from '../types';

export const notesQueries = {
  spaceNotes: (
    spaceId: string,
    options: { cursor?: string; limit?: number } = {}
  ) =>
    queryOptions({
      queryKey: notesKeys.space(spaceId),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options.cursor) params.set('cursor', options.cursor);
        if (options.limit) params.set('limit', String(options.limit));

        const { data } = await apiClient.get<NotesResponse>(
          `/api/spaces/${spaceId}/notes?${params.toString()}`
        );
        return data;
      },
      enabled: !!spaceId,
      staleTime: 1000 * 60 * 2,
    }),

  note: (spaceId: string, noteId: string) =>
    queryOptions({
      queryKey: notesKeys.detail(noteId),
      queryFn: async () => {
        const { data } = await apiClient.get<NoteUI>(
          `/api/spaces/${spaceId}/notes/${noteId}`
        );
        return data;
      },
      enabled: !!spaceId && !!noteId,
      staleTime: 1000 * 60 * 5,
    }),
};
