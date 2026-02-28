import { MutationOptions, QueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/api-clients';
import { profileKeys } from './keys';
import type { ProfileUI, ProfileDraft, ProfileType } from '../types';

export type CreateProfilePayload = ProfileDraft & {
  profileId: string;
  type?: ProfileType;
};

export type UpdateProfilePayload = ProfileDraft & {
  profileId: string;
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
      const { data } = await apiClient.post<ProfileUI>(
        `/api/profiles`,
        payload
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: profileKeys.profile(payload.profileId),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile(payload.profileId)
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        id: payload.profileId,
        type: payload.type || 'human',
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl ?? undefined,
        coverUrl: payload.coverUrl ?? undefined,
        bio: payload.bio ?? undefined,
        publicFields: payload.publicFields || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ProfileUI>(
        profileKeys.profile(payload.profileId),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(_payload.profileId),
          context.previousProfile
        );
      } else {
        queryClient.removeQueries({
          queryKey: profileKeys.profile(_payload.profileId),
        });
      }
    },

    onSuccess: (_data, _payload) => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({
        queryKey: profileKeys.profile(_payload.profileId),
      });
      // Invalidate user profiles list
      queryClient.invalidateQueries({
        queryKey: profileKeys.userProfiles(),
      });
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
      const { data } = await apiClient.patch<ProfileUI>(
        `/api/profiles/${payload.profileId}`,
        {
          displayName: payload.displayName,
          avatarUrl: payload.avatarUrl,
          coverUrl: payload.coverUrl,
          bio: payload.bio,
          publicFields: payload.publicFields,
          isActive: payload.isActive,
        }
      );
      return data;
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: profileKeys.profile(payload.profileId),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile(payload.profileId)
      );

      // Optimistically update
      const optimisticProfile: ProfileUI = {
        userId: previousProfile?.userId || 'unknown',
        id: previousProfile?.id || 'unknown',
        type: previousProfile?.type || 'human',
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl ?? undefined,
        coverUrl: payload.coverUrl ?? undefined,
        bio: payload.bio ?? undefined,
        publicFields: payload.publicFields || {},
        agentConfig: payload.agentConfig,
        isActive:
          payload.isActive !== undefined
            ? payload.isActive
            : previousProfile?.isActive || true,
        createdAt: previousProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ProfileUI>(
        profileKeys.profile(payload.profileId),
        optimisticProfile
      );

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(_payload.profileId),
          context.previousProfile
        );
      }
    },

    onSuccess: () => {
      // Invalidate to refetch with server data
      queryClient.invalidateQueries({ queryKey: profileKeys.profile() });
      // Invalidate user profiles list
      queryClient.invalidateQueries({
        queryKey: profileKeys.userProfiles(),
      });
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
      await apiClient.delete(`/api/profiles/${payload.profileId}`);
    },

    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: profileKeys.profile(payload.profileId),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileUI>(
        profileKeys.profile(payload.profileId)
      );

      // Remove from cache optimistically
      queryClient.removeQueries({
        queryKey: profileKeys.profile(payload.profileId),
      });

      return { previousProfile };
    },

    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(_payload.profileId),
          context.previousProfile
        );
      }
    },

    onSuccess: (_data, _payload) => {
      // Clean up related queries
      queryClient.removeQueries({
        queryKey: profileKeys.profile(_payload.profileId),
      });
      // Invalidate user profiles list
      queryClient.invalidateQueries({
        queryKey: profileKeys.userProfiles(),
      });
    },
  }),
};
