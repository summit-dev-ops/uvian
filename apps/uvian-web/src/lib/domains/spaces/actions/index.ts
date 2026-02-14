/**
 * Spaces Domain Actions
 *
 * BaseAction implementations for complex business logic.
 * Uses executeMutation to bridge with the API layer.
 */

import type { BaseAction, BaseActionContext } from '~/lib/actions';
import { executeMutation } from '~/lib/api/utils';
import { spacesMutations } from '../api';
import type {
  CreateSpacePayload,
  UpdateSpacePayload,
  InviteSpaceMemberPayload,
  RemoveSpaceMemberPayload,
  UpdateSpaceMemberRolePayload,
} from '../api';
import { SpaceMemberRole } from '../types';

// ============================================================================
// Actions
// ============================================================================

export const spacesActions = {
  /**
   * Create a new space.
   * Creates space, sets as active, navigates to it.
   */
  createSpace: (): BaseAction<CreateSpacePayload, Promise<void>> => ({
    id: 'spaces.createSpace',
    group: 'spaces',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return !!payload.name?.trim() && payload.name.length >= 2;
    },

    perform: async (ctx: BaseActionContext, payload: CreateSpacePayload) => {
      // Generate UUID if not provided
      const payloadWithId = {
        ...payload,
        id: payload.id || crypto.randomUUID(),
      };

      // Execute the mutation
      const newSpace = await executeMutation(
        ctx.queryClient,
        spacesMutations.createSpace(ctx.queryClient),
        payloadWithId
      );

      // Set as active space
      if (newSpace) {
        ctx.store.getState().setActiveSpace(newSpace.id);
      }

      // Navigate to the new space
      ctx.router.push(`/spaces/${newSpace.id}`);
    },
  }),

  /**
   * Update an existing space.
   */
  updateSpace: (): BaseAction<UpdateSpacePayload, Promise<void>> => ({
    id: 'spaces.updateSpace',
    group: 'spaces',
    variant: 'info',

    canPerform: (ctx, payload) => {
      const state = ctx.store.getState();
      const space = state.spaces.find((s) => s.id === payload.id);
      return !!payload.id && !!space && space.userRole === 'admin';
    },

    perform: async (ctx: BaseActionContext, payload: UpdateSpacePayload) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.updateSpace(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Delete a space.
   * Executes delete, navigates away if currently active.
   */
  deleteSpace: (
    spaceId: string
  ): BaseAction<{ authProfileId: string; spaceId: string }, Promise<void>> => ({
    id: 'spaces.deleteSpace',
    group: 'spaces',
    variant: 'destructive',

    canPerform: (ctx, payload) => {
      const state = ctx.store.getState();
      const space = state.spaces.find((s) => s.id === payload.spaceId);
      return !!payload.spaceId && space?.userRole === 'admin';
    },

    perform: async (
      ctx: BaseActionContext,
      payload: { authProfileId: string; spaceId: string }
    ) => {
      // Check if this is the active space
      const state = ctx.store.getState();
      const isActive = state.activeSpaceId === payload.spaceId;

      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        spacesMutations.deleteSpace(ctx.queryClient),
        payload
      );

      // If it was active, navigate away
      if (isActive) {
        state.setActiveSpace(null);
        ctx.router.push('/spaces');
      }
    },
  }),

  /**
   * Invite a member to a space.
   */
  inviteSpaceMember: (): BaseAction<
    InviteSpaceMemberPayload,
    Promise<void>
  > => ({
    id: 'spaces.inviteSpaceMember',
    group: 'spaces',
    variant: 'info',

    canPerform: (ctx, payload) => {
      const space = ctx.store
        .getState()
        .spaces.find((s) => s.id === payload.spaceId);
      return (
        !!payload.targetMemberProfileId &&
        !!payload.spaceId &&
        space?.userRole === 'admin'
      );
    },

    perform: async (
      ctx: BaseActionContext,
      payload: InviteSpaceMemberPayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.inviteSpaceMember(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Remove a member from a space.
   */
  removeSpaceMember: (): BaseAction<
    RemoveSpaceMemberPayload,
    Promise<void>
  > => ({
    id: 'spaces.removeSpaceMember',
    group: 'spaces',
    variant: 'destructive',

    canPerform: (ctx, payload) => {
      const space = ctx.store
        .getState()
        .spaces.find((s) => s.id === payload.spaceId);
      return (
        !!payload.targetMemberProfileId &&
        !!payload.spaceId &&
        space?.userRole === 'admin'
      );
    },

    perform: async (
      ctx: BaseActionContext,
      payload: RemoveSpaceMemberPayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.removeSpaceMember(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Update a member's role in a space.
   */
  updateSpaceMemberRole: (): BaseAction<
    UpdateSpaceMemberRolePayload,
    Promise<void>
  > => ({
    id: 'spaces.updateSpaceMemberRole',
    group: 'spaces',
    variant: 'info',

    canPerform: (ctx, payload) => {
      const space = ctx.store
        .getState()
        .spaces.find((s) => s.id === payload.spaceId);
      return (
        !!payload.targetMemberProfileId &&
        !!payload.spaceId &&
        space?.userRole === 'admin'
      );
    },

    perform: async (
      ctx: BaseActionContext,
      payload: UpdateSpaceMemberRolePayload
    ) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.updateSpaceMemberRole(ctx.queryClient),
        payload
      );
    },
  }),

  /**
   * Leave a space (user removes themselves).
   * Note: This action requires the current user ID to be passed as part of the payload.
   */
  leaveSpace: (
    spaceId: string,
    authProfileId: string
  ): BaseAction<void, Promise<void>> => ({
    id: 'spaces.leaveSpace',
    group: 'spaces',
    variant: 'destructive',

    canPerform: (ctx) => {
      const space = ctx.store.getState().spaces.find((s) => s.id === spaceId);
      return !!space && space.userRole === 'member' && !!authProfileId;
    },

    perform: async (ctx: BaseActionContext) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.removeSpaceMember(ctx.queryClient),
        { spaceId, authProfileId, targetMemberProfileId: authProfileId }
      );

      // If it was active space, navigate away
      const state = ctx.store.getState();
      if (state.activeSpaceId === spaceId) {
        state.setActiveSpace(null);
        ctx.router.push('/spaces');
      }
    },
  }),

  /**
   * Join a space (user adds themselves as member).
   * Note: This action requires the current user ID to be passed as part of the payload.
   */
  joinSpace: (
    spaceId: string,
    authProfileId: string
  ): BaseAction<void, Promise<void>> => ({
    id: 'spaces.joinSpace',
    group: 'spaces',
    variant: 'info',

    canPerform: (ctx) => {
      const space = ctx.store.getState().spaces.find((s) => s.id === spaceId);
      return !!space && !space.userRole && !!authProfileId; // Not already a member
    },

    perform: async (ctx: BaseActionContext) => {
      await executeMutation(
        ctx.queryClient,
        spacesMutations.inviteSpaceMember(ctx.queryClient),
        {
          authProfileId,
          spaceId,
          targetMemberProfileId: authProfileId,
          role: { name: 'member' },
        }
      );

      // Refresh spaces list to get updated membership
      await ctx.queryClient.refetchQueries({ queryKey: ['spaces', 'list'] });
    },
  }),

  // ============================================================================
  // Bulk Operations (Static functions for Action Manager)
  // ============================================================================

  /**
   * Remove multiple members from a space.
   * Static function for bulk operations using the action manager.
   */
  bulkRemoveMembers: async (
    authProfileId: string,
    targetMemberProfileId: string[],
    context: BaseActionContext,
    spaceId: string
  ) => {
    const promises = targetMemberProfileId.map(async (profileId) => {
      await executeMutation(
        context.queryClient,
        spacesMutations.removeSpaceMember(context.queryClient),
        { spaceId, authProfileId, targetMemberProfileId: profileId }
      );
    });

    await Promise.all(promises);
  },

  /**
   * Update multiple member roles in a space.
   * Static function for bulk operations using the action manager.
   */
  bulkUpdateMemberRole: async (
    authProfileId: string,
    targetMemberProfileIds: string[],
    newRole: SpaceMemberRole['name'],
    context: BaseActionContext,
    spaceId: string
  ) => {
    const promises = targetMemberProfileIds.map(async (profileId) => {
      await executeMutation(
        context.queryClient,
        spacesMutations.updateSpaceMemberRole(context.queryClient),
        {
          authProfileId,
          spaceId,
          targetMemberProfileId: profileId,
          role: { name: newRole },
        }
      );
    });

    await Promise.all(promises);
  },

  /**
   * Delete multiple spaces.
   * Static function for bulk operations using the action manager.
   */
  bulkDeleteSpaces: async (
    authProfileId: string,
    spaceIds: string[],
    context: BaseActionContext
  ) => {
    const promises = spaceIds.map(async (spaceId) => {
      await executeMutation(
        context.queryClient,
        spacesMutations.deleteSpace(context.queryClient),
        { authProfileId, spaceId }
      );

      // Clear cache for each space
      const state = context.store.getState();
      state.removeSpace(spaceId);
    });

    await Promise.all(promises);
  },
};
