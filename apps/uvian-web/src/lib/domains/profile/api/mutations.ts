import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { profileKeys } from './keys';
import type {
  ProfileUI,
  ProfileDraft,
  ProfileType,
} from '../types';

export type CreateProfilePayload = ProfileDraft & {
  id?: string;
  type?: ProfileType;
};

export type UpdateProfilePayload = ProfileDraft & {
  profileId:string;
};

export type DeleteProfilePayload = {
  profileId: string;
};

type CreateProfileContext = {
  previousProfile?: ProfileUI;
};

type UpdateProfileContext = {
  previousProfile?: ProfileUI;
};

export const profileMutations = {
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
      const { data } = await apiClient.post<ProfileUI>(`/api/profiles`, {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields,
        type: payload.type,
      });
      return data
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile()
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        id: 'temp-' + crypto.randomUUID(),
        userId: 'temp-' + crypto.randomUUID(),
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
        profileKeys.profile(),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.profile(), context.previousProfile);
      } else {
        queryClient.removeQueries({ queryKey: profileKeys.profile() });
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() });
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
      const { data } = await apiClient.put<ProfileUI>(`/api/profiles/${payload.profileId}`, {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        publicFields: payload.publicFields,
        isActive: payload.isActive,
      });
      return data
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile()
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        userId: previousProfile?.userId || 'unknown',
        id: previousProfile?.id || 'unknown',
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
        profileKeys.profile(),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.profile(), context.previousProfile);
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() });
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
      await queryClient.cancelQueries({ queryKey: profileKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile()
      );

      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: profileKeys.profile() });

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.profile(), context.previousProfile);
      }
    },

    onSuccess: () => {
      // Clean up related queries
      queryClient.removeQueries({ queryKey: profileKeys.profile() });
    },
  }),
};
