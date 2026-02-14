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
  UpdateSettingsPayload,
} from '../api/mutations';

// ============================================================================
// Actions
// ============================================================================

export const userActions = {
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
