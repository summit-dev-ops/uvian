/**
 * Spaces Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating, updating, deleting spaces, and managing members.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { spacesKeys } from './keys';
import { spacesUtils } from '../utils';
import type {
  SpaceAPI,
  SpaceUI,
  SpaceMemberAPI,
  SpaceMemberUI,
} from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateSpacePayload = {
  name: string;
  description?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  is_private?: boolean;
};

export type UpdateSpacePayload = {
  id: string;
} & Partial<CreateSpacePayload>;

export type InviteSpaceMemberPayload = {
  spaceId: string;
  profileId: string;
  role?: any;
};

export type RemoveSpaceMemberPayload = {
  spaceId: string;
  profileId: string;
};

export type UpdateSpaceMemberRolePayload = {
  spaceId: string;
  profileId: string;
  role: any;
};

// ============================================================================
// Mutation Context Types
// ============================================================================

type CreateSpaceContext = {
  previousSpaces?: SpaceUI[];
};

type UpdateSpaceContext = {
  previousSpace?: SpaceUI;
};

type DeleteSpaceContext = {
  previousSpaces?: SpaceUI[];
};

// ============================================================================
// Mutation Options
// ============================================================================

export const spacesMutations = {
  /**
   * Create a new space.
   */
  createSpace: (
    queryClient: QueryClient
  ): MutationOptions<
    SpaceUI,
    Error,
    CreateSpacePayload,
    CreateSpaceContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<SpaceAPI>('/api/spaces', payload);
      return spacesUtils.spaceApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: spacesKeys.list() });

      // Snapshot previous value
      const previousSpaces = queryClient.getQueryData<SpaceUI[]>(
        spacesKeys.list()
      );

      // Optimistically update
      const optimisticSpace: SpaceUI = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: payload.name,
        description: payload.description,
        avatarUrl: payload.avatar_url,
        createdBy: '', // Will be set by server
        settings: payload.settings || {},
        isPrivate: payload.is_private || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending',
      };

      queryClient.setQueryData<SpaceUI[]>(spacesKeys.list(), (old) =>
        old ? [optimisticSpace, ...old] : [optimisticSpace]
      );

      return { previousSpaces };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousSpaces) {
        queryClient.setQueryData(spacesKeys.list(), context.previousSpaces);
      }
    },

    onSuccess: (newSpace) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: spacesKeys.list() });
      queryClient.invalidateQueries({ queryKey: spacesKeys.stats() });
    },
  }),

  /**
   * Update an existing space.
   */
  updateSpace: (
    queryClient: QueryClient
  ): MutationOptions<
    SpaceUI,
    Error,
    UpdateSpacePayload,
    UpdateSpaceContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<SpaceAPI>(
        `/api/spaces/${payload.id}`,
        payload
      );
      return spacesUtils.spaceApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: spacesKeys.detail(payload.id),
      });

      // Snapshot previous value
      const previousSpace = queryClient.getQueryData<SpaceUI>(
        spacesKeys.detail(payload.id)
      );

      // Optimistically update
      const updatedSpace: Partial<SpaceUI> = {};
      if (payload.name) updatedSpace.name = payload.name;
      if (payload.description !== undefined)
        updatedSpace.description = payload.description;
      if (payload.avatar_url !== undefined)
        updatedSpace.avatarUrl = payload.avatar_url;
      if (payload.settings !== undefined)
        updatedSpace.settings = payload.settings;
      if (payload.is_private !== undefined)
        updatedSpace.isPrivate = payload.is_private;
      updatedSpace.updatedAt = new Date();
      updatedSpace.syncStatus = 'pending';

      queryClient.setQueryData<SpaceUI>(spacesKeys.detail(payload.id), (old) =>
        old ? { ...old, ...updatedSpace } : old
      );

      return { previousSpace };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousSpace) {
        queryClient.setQueryData(
          spacesKeys.detail(_payload.id),
          context.previousSpace
        );
      }
    },

    onSuccess: (updatedSpace) => {
      // Update specific space cache
      queryClient.setQueryData(
        spacesKeys.detail(updatedSpace.id),
        updatedSpace
      );

      // Update spaces list cache
      queryClient.setQueryData(spacesKeys.list(), (old: SpaceUI[] = []) =>
        old.map((space) =>
          space.id === updatedSpace.id ? updatedSpace : space
        )
      );
    },
  }),

  /**
   * Delete a space.
   */
  deleteSpace: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, { spaceId: string }, DeleteSpaceContext> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/spaces/${payload.spaceId}`);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: spacesKeys.list() });

      // Snapshot previous conversations
      const previousSpaces = queryClient.getQueryData<SpaceUI[]>(
        spacesKeys.list()
      );

      // Optimistically remove from list
      queryClient.setQueryData<SpaceUI[]>(
        spacesKeys.list(),
        (old) => old?.filter((space) => space.id !== payload.spaceId) || []
      );

      return { previousSpaces };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousSpaces) {
        queryClient.setQueryData(spacesKeys.list(), context.previousSpaces);
      }
    },

    onSuccess: (_data, payload) => {
      // Remove space-specific caches
      queryClient.removeQueries({
        queryKey: spacesKeys.detail(payload.spaceId),
      });
      queryClient.removeQueries({
        queryKey: spacesKeys.members(payload.spaceId),
      });
      queryClient.removeQueries({
        queryKey: spacesKeys.conversations(payload.spaceId),
      });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: spacesKeys.stats() });
    },
  }),

  /**
   * Invite a member to a space.
   */
  inviteSpaceMember: (
    queryClient: QueryClient
  ): MutationOptions<SpaceMemberUI, Error, InviteSpaceMemberPayload> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<SpaceMemberAPI>(
        `/api/spaces/${payload.spaceId}/members/invite`,
        {
          profile_id: payload.profileId,
          role: payload.role || { name: 'member' },
        }
      );
      return spacesUtils.spaceMemberApiToUi(data);
    },

    onSuccess: (_, payload) => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: spacesKeys.members(payload.spaceId),
      });

      // Update space member count
      queryClient.setQueryData(
        spacesKeys.detail(payload.spaceId),
        (old: SpaceUI | undefined) => {
          if (!old) return old;
          return { ...old, memberCount: (old.memberCount || 0) + 1 };
        }
      );
    },
  }),

  /**
   * Remove a member from a space.
   */
  removeSpaceMember: (
    queryClient: QueryClient
  ): MutationOptions<void, Error, RemoveSpaceMemberPayload> => ({
    mutationFn: async (payload) => {
      await apiClient.delete(
        `/api/spaces/${payload.spaceId}/members/${payload.profileId}`
      );
    },

    onSuccess: (_, payload) => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: spacesKeys.members(payload.spaceId),
      });

      // Update space member count
      queryClient.setQueryData(
        spacesKeys.detail(payload.spaceId),
        (old: SpaceUI | undefined) => {
          if (!old) return old;
          return {
            ...old,
            memberCount: Math.max((old.memberCount || 0) - 1, 0),
          };
        }
      );
    },
  }),

  /**
   * Update a member's role in a space.
   */
  updateSpaceMemberRole: (
    queryClient: QueryClient
  ): MutationOptions<SpaceMemberUI, Error, UpdateSpaceMemberRolePayload> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<SpaceMemberAPI>(
        `/api/spaces/${payload.spaceId}/members/${payload.profileId}/role`,
        { role: payload.role }
      );
      return spacesUtils.spaceMemberApiToUi(data);
    },

    onSuccess: (_, payload) => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: spacesKeys.members(payload.spaceId),
      });
    },
  }),
};
