import type { BaseAction, BaseActionContext } from '~/lib/actions';
import { executeMutation } from '~/lib/api/utils';
import { profileMutations } from '../api/mutations';
import type {
  CreateProfilePayload,
  UpdateProfilePayload,
  DeleteProfilePayload,
} from '../api/mutations';

export const profileActions = {
  createProfile: (): BaseAction<CreateProfilePayload, Promise<void>> => ({
    id: 'profile.createProfile',
    group: 'profile',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.displayName.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: CreateProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        profileMutations.createProfile(ctx.queryClient),
        payload
      );

      // Clear the profile draft for this user in the store
      const state = ctx.store.getState();
      state.clearProfileDraft();
    },
  }),

  updateProfile: (): BaseAction<UpdateProfilePayload, Promise<void>> => ({
    id: 'profile.updateProfile',
    group: 'profile',
    variant: 'info',

    canPerform: (ctx, payload) => {
      return payload.displayName.trim().length > 0;
    },

    perform: async (ctx: BaseActionContext, payload: UpdateProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        profileMutations.updateProfile(ctx.queryClient),
        payload
      );

      // Clear the profile draft for this user in the store
      const state = ctx.store.getState();
      state.clearProfileDraft();
    },
  }),

  deleteProfile: (): BaseAction<DeleteProfilePayload, Promise<void>> => ({
    id: 'profile.deleteProfile',
    group: 'profile',
    variant: 'destructive',

    canPerform: (ctx, payload) => {
      return !!payload.profileId;
    },

    perform: async (ctx: BaseActionContext, payload: DeleteProfilePayload) => {
      // Execute the mutation
      await executeMutation(
        ctx.queryClient,
        profileMutations.deleteProfile(ctx.queryClient),
        payload
      );

      // Clear all user-related state
      const state = ctx.store.getState();
      state.clearProfileDraft();
      state.setIsEditingProfile(false);
    },
  }),
};
