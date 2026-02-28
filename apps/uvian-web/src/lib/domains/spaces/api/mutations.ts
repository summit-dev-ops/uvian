/**
 * Spaces Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating, updating, deleting spaces, and managing members.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { spacesKeys } from './keys';
import type { SpaceUI, SpaceMemberUI, SpaceMemberRole } from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateSpacePayload = {
  id?: string;
  name: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  settings?: Record<string, any>;
  isPrivate?: boolean;
};

export type UpdateSpacePayload = {
  id: string;
} & Partial<CreateSpacePayload>;

export type InviteSpaceMemberPayload = {
  spaceId: string;
  targetMemberUserId: string;
  role?: SpaceMemberRole;
};

export type RemoveSpaceMemberPayload = {
  spaceId: string;
  targetMemberUserId: string;
};

export type UpdateSpaceMemberRolePayload = {
  spaceId: string;
  targetMemberUserId: string;
  role: SpaceMemberRole;
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
      const payloadWithId = {
        ...payload,
        id: payload.id || crypto.randomUUID(),
      };
      const { data } = await apiClient.post<SpaceUI>(
        '/api/spaces',
        payloadWithId
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: spacesKeys.list(),
      });

      // Snapshot previous value
      const previousSpaces = queryClient.getQueryData<SpaceUI[]>(
        spacesKeys.list()
      );

      // Generate UUID for optimistic update (consistent with server)
      const spaceId = payload.id || crypto.randomUUID();

      // Optimistically update with real UUID
      const optimisticSpace: SpaceUI = {
        id: spaceId,
        name: payload.name,
        description: payload.description,
        coverUrl: payload.coverUrl,
        avatarUrl: payload.avatarUrl,
        createdBy: '', // Will be set by server
        settings: payload.settings || {},
        isPrivate: payload.isPrivate || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    onSuccess: (newSpace, _payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: spacesKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: spacesKeys.stats(),
      });
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
      const { data } = await apiClient.patch<SpaceUI>(
        `/api/spaces/${payload.id}`,
        payload
      );
      return data;
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
      if (payload.coverUrl !== undefined)
        updatedSpace.coverUrl = payload.coverUrl;
      if (payload.avatarUrl !== undefined)
        updatedSpace.avatarUrl = payload.avatarUrl;
      if (payload.settings !== undefined)
        updatedSpace.settings = payload.settings;
      if (payload.isPrivate !== undefined)
        updatedSpace.isPrivate = payload.isPrivate;
      updatedSpace.updatedAt = new Date().toISOString();
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

    onSuccess: (updatedSpace, payload) => {
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
      await queryClient.cancelQueries({
        queryKey: spacesKeys.list(),
      });

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
      queryClient.invalidateQueries({
        queryKey: spacesKeys.stats(),
      });
    },
  }),

  /**
   * Invite a member to a space.
   */
  inviteSpaceMember: (
    queryClient: QueryClient
  ): MutationOptions<SpaceMemberUI, Error, InviteSpaceMemberPayload> => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<SpaceMemberUI>(
        `/api/spaces/${payload.spaceId}/members/invite`,
        {
          userId: payload.targetMemberUserId,
          role: payload.role || { name: 'member' },
        }
      );
      return data;
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
        `/api/spaces/${payload.spaceId}/members/${payload.targetMemberUserId}`
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
      const { data } = await apiClient.patch<SpaceMemberUI>(
        `/api/spaces/${payload.spaceId}/members/${payload.targetMemberUserId}/role`,
        { role: payload.role }
      );
      return data;
    },
    onSuccess: (_, payload) => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: spacesKeys.members(payload.spaceId),
      });
    },
  }),
};
