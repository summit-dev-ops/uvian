/**
 * User Domain Actions
 *
 * BaseAction implementations for complex business logic.
 * Uses executeMutation to bridge with the API layer.
 */

import type { BaseAction, BaseActionContext } from '~/lib/actions';
import { executeMutation } from '~/lib/api/utils';
import { userMutations } from '../api/mutations';
import type {
  CreateProfilePayload,
  UpdateProfilePayload,
  DeleteProfilePayload,
  UpdateSettingsPayload,
} from '../api/mutations';

// ============================================================================
// Actions
// ============================================================================

export const userActions = {
  /**
   * Create a new user profile for the current authenticated user.
   * Validates display name, executes mutation, clears draft.
   */
  createProfile: (): BaseAction<CreateProfilePayload, Promise<void>> => ({
    id: 'user.createProfile',
    group: 'user',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.displayName.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: CreateProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        userMutations.createProfile(ctx.queryClient),
        payload
      );

      // Clear the profile draft for this user in the store
      const state = ctx.store.getState();
      state.clearProfileDraft();
    },
  }),

  /**
   * Update the current user's profile.
   * Validates display name, executes mutation, clears draft.
   */
  updateProfile: (): BaseAction<UpdateProfilePayload, Promise<void>> => ({
    id: 'user.updateProfile',
    group: 'user',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.displayName.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: UpdateProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        userMutations.updateProfile(ctx.queryClient),
        payload
      );

      // Clear the profile draft for this user in the store
      const state = ctx.store.getState();
      state.clearProfileDraft();
    },
  }),

  /**
   * Delete the current user's profile.
   * Executes delete mutation and clears related state.
   */
  deleteProfile: (): BaseAction<DeleteProfilePayload, Promise<void>> => ({
    id: 'user.deleteProfile',
    group: 'user',
    variant: 'destructive',

    canPerform: (ctx, payload) => {
      return !!payload.userId;
    },

    perform: async (ctx: BaseActionContext, payload: DeleteProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        userMutations.deleteProfile(ctx.queryClient),
        payload
      );

      // Clear all user-related state
      const state = ctx.store.getState();
      state.clearProfileDraft();
      state.clearSettingsDraft();
      state.setIsEditingProfile(false);
      state.setIsEditingSettings(false);
    },
  }),

  /**
   * Update the current user's settings.
   * Executes mutation and clears settings draft.
   */
  updateSettings: (): BaseAction<UpdateSettingsPayload, Promise<void>> => ({
    id: 'user.updateSettings',
    group: 'user',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return typeof payload === 'object' && payload !== null;
    },

    perform: async (ctx: BaseActionContext, payload: UpdateSettingsPayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        userMutations.updateSettings(ctx.queryClient),
        payload
      );

      // Clear the settings draft for this user in the store
      const state = ctx.store.getState();
      state.clearSettingsDraft();
    },
  }),
};
