/**
 * Feed Domain Mutations
 *
 * TanStack Query mutationOptions for feed actions.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { feedKeys } from './keys';

export type MarkAsReadPayload = {
  authProfileId: string;
  itemId: string;
};

export type MarkAllReadPayload = {
  authProfileId: string;
  type?: 'post' | 'message' | 'job' | 'ticket';
  beforeItemId?: string;
};

type MarkAsReadContext = {
  previousFeed?: unknown[];
};

export const feedMutations = {
  markAsRead: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, MarkAsReadPayload, MarkAsReadContext> => ({
    mutationFn: async (payload) => {
      await apiClient.patch(
        `/api/feed/${payload.itemId}/read`,
        {},
        { headers: { 'x-profile-id': payload.authProfileId } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.feed() });
      queryClient.invalidateQueries({ queryKey: feedKeys.unreadCount() });
    },
  }),

  markAllAsRead: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, MarkAllReadPayload, MarkAsReadContext> => ({
    mutationFn: async (payload) => {
      const body: Record<string, string> = {};
      if (payload.type) body.type = payload.type;
      if (payload.beforeItemId) body.beforeItemId = payload.beforeItemId;

      await apiClient.post('/api/feed/read', body, {
        headers: { 'x-profile-id': payload.authProfileId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.feed() });
      queryClient.invalidateQueries({ queryKey: feedKeys.unreadCount() });
    },
  }),
};
