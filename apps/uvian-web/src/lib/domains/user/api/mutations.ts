/**
 * User Domain Mutations
 *
 * TanStack Query mutationOptions with optimistic updates.
 * Mutations handle creating, updating, and deleting user profiles and settings.
 * All mutations work for the current authenticated user only.
 */

import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { userKeys } from './keys';
import type {
  SettingsUI,
  SettingsDraft,
} from '../types';

export type UpdateSettingsPayload = SettingsDraft;


type UpdateSettingsContext = {
  previousSettings?: SettingsUI;
};

// ============================================================================
// Mutation Options
// ============================================================================

export const userMutations = {
  /**
   * Update the current user's settings.
   */
  updateSettings: (
    queryClient: QueryClient
  ): MutationOptions<
    SettingsUI,
    Error,
    UpdateSettingsPayload,
    UpdateSettingsContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put<SettingsUI>(
        `/api/profiles/me/settings`,
        payload
      );
      return data
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.settings() });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<SettingsUI>(
        userKeys.settings()
      );

      // Optimistically update
      const optimisticSettings: SettingsUI = {
        userId: previousSettings?.userId || 'unknown',
        settings: payload,
        createdAt: previousSettings?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<SettingsUI>(
        userKeys.settings(),
        optimisticSettings
      );

      return { previousSettings };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(userKeys.settings(), context.previousSettings);
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: userKeys.settings() });
    },
  }),
};
