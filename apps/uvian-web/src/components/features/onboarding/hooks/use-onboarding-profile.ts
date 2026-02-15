'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileMutations } from '~/lib/domains/profile/api/mutations';
import type { ProfileType } from '~/lib/domains/profile/types';
import type { OnboardingProfileData } from '../types';

/**
 * useOnboardingProfile - Profile integration hook
 *
 * Handles profile creation and management during onboarding.
 * Bridges to existing profile domain mutations and queries.
 *
 * @param queryClient - React Query client for data management
 * @param profileId - Optional existing profile ID to track
 *
 * @returns Profile creation interface with mutation handling
 */
export function useOnboardingProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  profileId?: string
) {
  // Create profile mutation using existing domain logic
  const createProfileMutation = useMutation(
    profileMutations.createProfile(queryClient)
  );

  // Track if profile has been created
  const hasCreatedProfile = React.useMemo(() => {
    return !!profileId || !!createProfileMutation.data;
  }, [profileId, createProfileMutation.data]);

  // Track profile creation status
  const profileCreationStatus = React.useMemo(() => {
    if (createProfileMutation.isPending) return 'creating';
    if (createProfileMutation.isError) return 'error';
    if (hasCreatedProfile) return 'completed';
    return 'idle';
  }, [
    createProfileMutation.isPending,
    createProfileMutation.isError,
    hasCreatedProfile,
  ]);

  // Create profile function
  const createProfile = React.useCallback(
    async (data: OnboardingProfileData) => {
      const profileData = {
        displayName: data.displayName,
        type: data.type as ProfileType,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl,
        publicFields: {},
        isActive: true,
      };

      const result = await createProfileMutation.mutateAsync(profileData);

      return { profileId: result.id };
    },
    [createProfileMutation]
  );

  // Utility functions
  const resetProfileCreation = React.useCallback(() => {
    createProfileMutation.reset();
  }, [createProfileMutation]);

  const refreshProfileQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] });
  }, [queryClient]);

  return {
    // Core profile operations
    createProfile,
    isCreatingProfile: createProfileMutation.isPending,
    profileCreationError: createProfileMutation.error,
    hasCreatedProfile,

    // Status and state
    profileCreationStatus,
    createdProfileId: createProfileMutation.data?.id || profileId,

    // Utility functions
    resetProfileCreation,
    refreshProfileQueries,
  };
}
