'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { profileMutations } from '~/lib/domains/profile/api/mutations';
import { profileQueries } from '~/lib/domains/profile/api/queries';
import type { ProfileType } from '~/lib/domains/profile/types';
import type {
  OnboardingContextValue,
  OnboardingState,
  OnboardingStep,
  OnboardingProfileData,
  OnboardingConfig,
} from '../types';

const DEFAULT_CONFIG: Required<OnboardingConfig> = {
  enableSkip: true,
  enableBackNavigation: true,
  autoProgressOnComplete: true,
  requireProfileType: true,
  showAvatarUpload: true,
};

const STEP_PROGRESS = {
  welcome: 0,
  'profile-creation': 50,
  completion: 100,
} as const;

/**
 * useOnboarding - Orchestrator hook for onboarding feature
 *
 * Manages the entire onboarding flow while delegating domain operations
 * to existing profile infrastructure. Follows the "hook bridge" pattern.
 *
 * @param config - Configuration options for onboarding behavior
 * @returns OnboardingContextValue - Complete onboarding context
 */
export function useOnboarding(
  config: OnboardingConfig = {}
): OnboardingContextValue {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check if user needs onboarding by querying existing profile data
  const { data: userProfiles, isLoading: profilesLoading } =
    queryClient.getQueryData(profileQueries.userProfiles().queryKey)
      ? {
          data: queryClient.getQueryData(
            profileQueries.userProfiles().queryKey
          ),
          isLoading: false,
        }
      : { data: undefined, isLoading: true };

  // Fetch user profiles for onboarding check
  React.useEffect(() => {
    queryClient.ensureQueryData(profileQueries.userProfiles());
  }, [queryClient]);

  // Local onboarding state
  const [state, setState] = React.useState<OnboardingState>({
    currentStep: 'welcome',
    isActive: false,
    hasStarted: false,
    isCompleted: false,
  });

  // Create profile mutation using existing domain logic
  const createProfileMutation = useMutation(
    profileMutations.createProfile(queryClient)
  );

  // Determine if user needs onboarding
  const needsOnboarding = React.useMemo(() => {
    // If profiles are still loading, assume they need onboarding
    if (profilesLoading) return true;

    // If no profiles exist, user needs onboarding
    return !userProfiles || userProfiles.length === 0;
  }, [userProfiles, profilesLoading]);

  // Start onboarding flow
  const startOnboarding = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      hasStarted: true,
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      isCompleted: true,
    }));

    // Navigate to dashboard or main app
    if (finalConfig.autoProgressOnComplete) {
      router.push('/home');
    }
  }, [router, finalConfig.autoProgressOnComplete]);

  // Skip onboarding
  const skipOnboarding = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      isCompleted: true,
    }));

    router.push('/dashboard');
  }, [router]);

  // Navigation methods
  const goToStep = React.useCallback((step: OnboardingStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const nextStep = React.useCallback(() => {
    setState((prev) => {
      const stepOrder: OnboardingStep[] = [
        'welcome',
        'profile-creation',
        'completion',
      ];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);

      return {
        ...prev,
        currentStep: stepOrder[nextIndex],
      };
    });
  }, []);

  const previousStep = React.useCallback(() => {
    if (!finalConfig.enableBackNavigation) return;

    setState((prev) => {
      const stepOrder: OnboardingStep[] = [
        'welcome',
        'profile-creation',
        'completion',
      ];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);

      return {
        ...prev,
        currentStep: stepOrder[prevIndex],
      };
    });
  }, [finalConfig.enableBackNavigation]);

  // Create profile for onboarding
  const createProfile = React.useCallback(
    async (data: OnboardingProfileData) => {
      const profileData = {
        profileId: crypto.randomUUID(),
        displayName: data.displayName,
        type: data.type as ProfileType,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl,
        publicFields: {},
        isActive: true,
      };

      const result = await createProfileMutation.mutateAsync(profileData);

      setState((prev) => ({
        ...prev,
        profileId: result.id,
      }));

      return { profileId: result.id };
    },
    [createProfileMutation]
  );

  // Utility computed values
  const canProceedToNext = React.useMemo(() => {
    switch (state.currentStep) {
      case 'welcome':
        return true;
      case 'profile-creation':
        return !createProfileMutation.isPending;
      case 'completion':
        return true;
      default:
        return false;
    }
  }, [state.currentStep, createProfileMutation.isPending]);

  const canGoBack = React.useMemo(() => {
    if (!finalConfig.enableBackNavigation) return false;

    switch (state.currentStep) {
      case 'welcome':
        return false;
      case 'profile-creation':
      case 'completion':
        return true;
      default:
        return false;
    }
  }, [state.currentStep, finalConfig.enableBackNavigation]);

  const progress = React.useMemo(() => {
    return STEP_PROGRESS[state.currentStep] || 0;
  }, [state.currentStep]);

  return {
    // State
    state,

    // Navigation
    goToStep,
    nextStep,
    previousStep,

    // Profile creation
    createProfile,
    isCreatingProfile: createProfileMutation.isPending,
    profileCreationError: createProfileMutation.error,

    // Lifecycle
    startOnboarding,
    completeOnboarding,
    skipOnboarding,

    // Utility
    needsOnboarding,
    canProceedToNext,
    canGoBack,
    progress,
  };
}
