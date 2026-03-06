/**
 * Posts Domain Mutations
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { postsKeys } from './keys';
import { notesKeys } from '~/lib/domains/notes/api/keys';
import type { NoteUI } from '~/lib/domains/notes/types';
import type {
  Attachment,
  PostUI,
  PostsResponse,
  PostContentType,
} from '../types';

export type CreateNotePayload = {
  title: string;
  body?: string;
  attachments?: Attachment[];
};

export type PostContentPayload = {
  type: PostContentType;
  note?: CreateNotePayload;
  noteId?: string;
  assetId?: string;
  asset?: {
    filename: string;
    mimeType?: string;
    url?: string;
  };
  url?: string;
};

export type CreatePostPayload = {
  id: string;
  spaceId: string;
  userId: string;
  contents: PostContentPayload[];
};

export type DeletePostPayload = {
  postId: string;
};

type CreatePostContext = {
  previousPosts?: PostsResponse;
};

export const postsMutations = {
  createPost: (
    queryClient: QueryClient
  ): MutationOptions<PostUI, Error, CreatePostPayload, CreatePostContext> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<PostUI>(
        `/api/spaces/${payload.spaceId}/posts`,
        {
          id: payload.id,
          contents: payload.contents,
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: postsKeys.posts(payload.spaceId),
      });

      const previousPosts = queryClient.getQueryData<PostsResponse>(
        postsKeys.posts(payload.spaceId)
      );

      // Add notes to cache for immediate display
      for (const content of payload.contents) {
        if (content.type === 'note' && content.noteId && content.note) {
          const optimisticNote: NoteUI = {
            id: content.noteId,
            spaceId: payload.spaceId,
            ownerUserId: '',
            title: content.note.title,
            body: content.note.body || null,
            attachments: content.note.attachments || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          queryClient.setQueryData(
            notesKeys.detail(content.noteId),
            optimisticNote
          );
        }
      }

      // Convert contents to PostContent format for optimistic update
      const optimisticContents = payload.contents.map((content, index) => {
        if (content.type === 'note') {
          return {
            id: `temp-${index}`,
            contentType: content.type,
            noteId: content.noteId || null,
            assetId: null,
            url: null,
          };
        }
        if (content.type === 'asset') {
          return {
            id: `temp-${index}`,
            contentType: content.type,
            noteId: null,
            assetId: content.assetId || null,
            url: null,
          };
        }
        return {
          id: `temp-${index}`,
          contentType: content.type,
          noteId: null,
          assetId: null,
          url: content.url || null,
        };
      });

      const optimisticPost: PostUI = {
        id: payload.id,
        spaceId: payload.spaceId,
        userId: payload.userId,
        contents: optimisticContents,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PostsResponse>(
        postsKeys.posts(payload.spaceId),
        (old) =>
          old
            ? { ...old, items: [optimisticPost, ...old.items] }
            : { items: [optimisticPost], nextCursor: null, hasMore: false }
      );

      return { previousPosts };
    },

    onError: (_err, payload, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          postsKeys.posts(payload.spaceId),
          context.previousPosts
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
  }),

  deletePost: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, DeletePostPayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/posts/${payload.postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.posts() });
    },
  }),
};
