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
import { userUtils } from '../utils';
import type {
  ProfileAPI,
  ProfileUI,
  SettingsAPI,
  SettingsUI,
  ProfileDraft,
  SettingsDraft,
  ProfileType,
} from '../types';

// ============================================================================
// Mutation Payloads
// ============================================================================

export type CreateProfilePayload = ProfileDraft & {
  id?: string; // Optional client-generated ID for optimistic updates
  type?: ProfileType;
};

export type UpdateProfilePayload = ProfileDraft;

export type DeleteProfilePayload = {
  profileId: string;
};

export type CreateAgentProfilePayload = ProfileDraft & {
  agentConfig: any;
};

export type UpdateSettingsPayload = SettingsDraft;

// ============================================================================
// Mutation Context Types
// ============================================================================

type CreateProfileContext = {
  previousProfile?: ProfileUI;
};

type UpdateProfileContext = {
  previousProfile?: ProfileUI;
};

type UpdateSettingsContext = {
  previousSettings?: SettingsUI;
};

// ============================================================================
// Mutation Options
// ============================================================================

export const userMutations = {
  /**
   * Create a new user profile for the current authenticated user.
   */
  createProfile: (
    queryClient: QueryClient
  ): MutationOptions<
    ProfileUI,
    Error,
    CreateProfilePayload,
    CreateProfileContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ProfileAPI>(`/api/profiles`, {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields,
        type: payload.type,
      });
      return userUtils.profileApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        userKeys.profile()
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        userId: 'temp-' + crypto.randomUUID(),
        profileId: 'temp-' + crypto.randomUUID(),
        type: payload.type || 'human',
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<ProfileUI>(
        userKeys.profile(),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      } else {
        queryClient.removeQueries({ queryKey: userKeys.profile() });
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  }),

  /**
   * Update the current user's profile.
   */
  updateProfile: (
    queryClient: QueryClient
  ): MutationOptions<
    ProfileUI,
    Error,
    UpdateProfilePayload,
    UpdateProfileContext
  > => ({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put<ProfileAPI>(`/api/profiles/me`, {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields,
        isActive: payload.isActive,
      });
      return userUtils.profileApiToUi(data);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        userKeys.profile()
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        userId: previousProfile?.userId || 'unknown',
        profileId: previousProfile?.profileId || 'unknown',
        type: previousProfile?.type || 'human',
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields || {},
        agentConfig: payload.agentConfig,
        isActive:
          payload.isActive !== undefined
            ? payload.isActive
            : previousProfile?.isActive || true,
        createdAt: previousProfile?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<ProfileUI>(
        userKeys.profile(),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  }),

  /**
   * Delete the current user's profile.
   */
  deleteProfile: (
    queryClient: QueryClient
  ): MutationOptions<
    void,
    Error,
    DeleteProfilePayload,
    { previousProfile?: ProfileUI }
  > => ({
    mutationFn: async (payload) => {
      await apiClient.delete(`/api/profiles/me`);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        userKeys.profile()
      );

      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: userKeys.profile() });

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
    },

    onSuccess: () => {
      // Clean up related queries
      queryClient.removeQueries({ queryKey: userKeys.profile() });
    },
  }),

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
      const { data } = await apiClient.put<SettingsAPI>(
        `/api/profiles/me/settings`,
        payload
      );
      return userUtils.settingsApiToUi(data);
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
        profileId: previousSettings?.profileId || 'unknown',
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
