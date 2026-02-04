'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userQueries, userMutations } from '~/lib/domains/user/api';
import { userActions } from '~/lib/domains/user/actions';
import { useAction } from '~/lib/hooks/use-action';
import type { ProfileDraft, SettingsDraft } from '~/lib/domains/user/types';

/**
 * Hook for managing the current user's profile and settings.
 * Provides data fetching, mutations, and actions for profile management.
 */
export const useProfile = () => {
  const queryClient = useQueryClient();

  // 1. Fetch current user's profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery(userQueries.profile());

  // 2. Fetch current user's settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery(userQueries.settings());

  // 3. Profile mutations
  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: updateProfileError,
  } = useMutation(userMutations.updateProfile(queryClient));

  const {
    mutate: createProfile,
    isPending: isCreatingProfile,
    error: createProfileError,
  } = useMutation(userMutations.createProfile(queryClient));

  const {
    mutate: deleteProfile,
    isPending: isDeletingProfile,
    error: deleteProfileError,
  } = useMutation(userMutations.deleteProfile(queryClient));

  // 4. Settings mutations
  const {
    mutate: updateSettings,
    isPending: isUpdatingSettings,
    error: updateSettingsError,
  } = useMutation(userMutations.updateSettings(queryClient));

  // 5. Actions using the existing action system
  const { perform: performUpdateProfile, isPending: isActionUpdatingProfile } =
    useAction(userActions.updateProfile());

  const { perform: performCreateProfile, isPending: isActionCreatingProfile } =
    useAction(userActions.createProfile());

  const { perform: performDeleteProfile, isPending: isActionDeletingProfile } =
    useAction(userActions.deleteProfile());

  const {
    perform: performUpdateSettings,
    isPending: isActionUpdatingSettings,
  } = useAction(userActions.updateSettings());

  // 6. Helper functions for profile operations
  const handleUpdateProfile = async (data: ProfileDraft) => {
    // Try using action first for business logic
    try {
      await performUpdateProfile(data);
      return { success: true };
    } catch (error) {
      // Fallback to direct mutation if action fails
      updateProfile(data);
      return { success: true };
    }
  };

  const handleCreateProfile = async (data: ProfileDraft) => {
    // Try using action first for business logic
    try {
      await performCreateProfile(data);
      return { success: true };
    } catch (error) {
      // Fallback to direct mutation if action fails
      createProfile(data);
      return { success: true };
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    // Try using action first for business logic
    try {
      await performDeleteProfile({ userId });
      return { success: true };
    } catch (error) {
      // Fallback to direct mutation if action fails
      deleteProfile({ userId });
      return { success: true };
    }
  };

  const handleUpdateSettings = async (data: SettingsDraft) => {
    // Try using action first for business logic
    try {
      await performUpdateSettings(data);
      return { success: true };
    } catch (error) {
      // Fallback to direct mutation if action fails
      updateSettings(data);
      return { success: true };
    }
  };

  // 7. Cache management helpers
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: userQueries.profile().queryKey });
  };

  const refreshSettings = () => {
    queryClient.invalidateQueries({
      queryKey: userQueries.settings().queryKey,
    });
  };

  const invalidateAllUserData = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  return {
    // Profile data
    profile,
    settings,

    // Loading states
    isLoadingProfile,
    isLoadingSettings,
    isUpdatingProfile: isUpdatingProfile || isActionUpdatingProfile,
    isCreatingProfile: isCreatingProfile || isActionCreatingProfile,
    isDeletingProfile: isDeletingProfile || isActionDeletingProfile,
    isUpdatingSettings: isUpdatingSettings || isActionUpdatingSettings,

    // Error states
    profileError,
    settingsError,
    updateProfileError,
    createProfileError,
    deleteProfileError,
    updateSettingsError,

    // Actions
    handleUpdateProfile,
    handleCreateProfile,
    handleDeleteProfile,
    handleUpdateSettings,

    // Cache management
    refetchProfile,
    refetchSettings,
    refreshProfile,
    refreshSettings,
    invalidateAllUserData,

    // Profile state helpers
    hasProfile: !!profile,
    hasSettings: !!settings,
    isProfileOwner: true, // Always true for current user
  };
};
