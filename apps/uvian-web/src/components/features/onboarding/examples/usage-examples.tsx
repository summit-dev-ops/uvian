/**
 * Onboarding Hook Usage Examples
 *
 * This file demonstrates how to use the new component-based onboarding hooks
 * in React components. Each example shows different composition patterns.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Import the new hooks
import {
  useOnboardingState,
  useOnboardingEligibility,
  useOnboardingNavigation,
  useOnboardingProfile,
  useOnboardingLifecycle,
  useOnboardingProgress,
} from '../hooks';
import type { OnboardingProfileData } from '../types';

// ================
// BASIC USAGE EXAMPLES
// ================

// Example 1: Simple Progress Bar Component
export function ProgressBar() {
  // Only use the hooks we need - progress calculations
  const { state } = useOnboardingState();
  const progress = useOnboardingProgress(state);

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all"
        style={{ width: `${progress.progress}%` }}
      />
    </div>
  );
}

// Example 2: Navigation Buttons Component
export function NavigationButtons() {
  // Compose state + navigation hooks
  const { state, setCurrentStep } = useOnboardingState();
  const navigation = useOnboardingNavigation(state, setCurrentStep);

  return (
    <div className="flex justify-between">
      <button
        onClick={navigation.previousStep}
        disabled={!navigation.canGoBack}
        className="px-4 py-2 border rounded"
      >
        Previous
      </button>
      <button
        onClick={navigation.nextStep}
        disabled={!navigation.canProceedToNext}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Next
      </button>
    </div>
  );
}

// Example 3: Profile Creation Component
export function ProfileCreation() {
  const queryClient = useQueryClient();

  // Get all needed hooks from same component
  const { state, setActive, setCompleted } = useOnboardingState();
  const profile = useOnboardingProfile(queryClient, state.profileId);
  const lifecycle = useOnboardingLifecycle(
    state,
    setActive,
    setCompleted,
    {},
    {
      onComplete: () => console.log('Onboarding complete!'),
    }
  );

  return (
    <div>
      {profile.isCreatingProfile && <p>Creating profile...</p>}
      {profile.profileCreationError && (
        <p className="text-red-500">{profile.profileCreationError.message}</p>
      )}
      {/* Form would go here */}
      <button
        onClick={() => lifecycle.completeOnboarding()}
        disabled={!profile.hasCreatedProfile}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Complete Onboarding
      </button>
    </div>
  );
}

// ================
// STEP COMPONENTS
// ================

interface WelcomeStepProps {
  onNext: () => void;
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to UVian!</h2>
      <p className="mb-6">Let's get you set up with your profile.</p>
      <button
        onClick={onNext}
        className="bg-blue-500 text-white px-6 py-2 rounded"
      >
        Get Started
      </button>
    </div>
  );
}

interface ProfileCreationStepProps {
  onCreateProfile: (
    data: OnboardingProfileData
  ) => Promise<{ profileId: string }>;
  isLoading: boolean;
  error: Error | null;
}

function ProfileCreationStep({
  onCreateProfile,
  isLoading,
  error,
}: ProfileCreationStepProps) {
  const [formData, setFormData] = React.useState({
    displayName: '',
    type: 'human' as 'human' | 'agent' | 'system',
    bio: '',
    avatarUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateProfile(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="text-red-500 mb-4">
          Failed to create profile: {error.message}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">Display Name *</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) =>
            setFormData({ ...formData, displayName: e.target.value })
          }
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Profile Type *</label>
        <select
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as any })
          }
          className="w-full border rounded px-3 py-2"
        >
          <option value="human">Human</option>
          <option value="agent">Agent</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="bg-green-500 text-white px-6 py-2 rounded"
      >
        {isLoading ? 'Creating...' : 'Create Profile'}
      </button>
    </form>
  );
}

interface CompletionStepProps {
  onComplete: () => void;
  onSkip: () => void;
  profileData?: { displayName?: string };
}

function CompletionStep({
  onComplete,
  onSkip,
  profileData,
}: CompletionStepProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4 text-green-600">
        You're All Set!
      </h2>
      <p className="mb-6">
        Welcome{profileData?.displayName ? ` ${profileData.displayName}` : ''}!
        Your profile has been created successfully.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onComplete}
          className="bg-green-500 text-white px-6 py-2 rounded"
        >
          Enter UVian
        </button>
        <button onClick={onSkip} className="border px-6 py-2 rounded">
          Skip for Now
        </button>
      </div>
    </div>
  );
}

// ================
// COMPREHENSIVE CONTAINER EXAMPLE
// ================

export function OnboardingContainer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check eligibility first - don't render if not needed
  const eligibility = useOnboardingEligibility();
  if (!eligibility.needsOnboarding) {
    return null; // User doesn't need onboarding
  }

  // Compose all the hooks we need
  const {
    state,
    setCurrentStep,
    setActive,
    setCompleted,
    isWelcomeStep,
    isProfileCreationStep,
    isCompletionStep,
  } = useOnboardingState();

  const navigation = useOnboardingNavigation(state, setCurrentStep);
  const profile = useOnboardingProfile(queryClient, state.profileId);
  const lifecycle = useOnboardingLifecycle(
    state,
    setActive,
    setCompleted,
    {
      enableSkip: true,
      enableBackNavigation: true,
      autoProgressOnComplete: true,
    },
    {
      onComplete: () => {
        console.log('Onboarding completed!');
        router.push('/dashboard');
      },
      onSkip: () => {
        console.log('Onboarding skipped');
        router.push('/dashboard');
      },
    }
  );
  const progress = useOnboardingProgress(state);

  // Handle automatic step progression
  React.useEffect(() => {
    if (profile.hasCreatedProfile && isProfileCreationStep) {
      navigation.nextStep();
    }
  }, [profile.hasCreatedProfile, isProfileCreationStep, navigation]);

  // Handle onboarding start
  React.useEffect(() => {
    if (!state.hasStarted && !state.isCompleted) {
      lifecycle.startOnboarding();
    }
  }, [state.hasStarted, state.isCompleted, lifecycle]);

  return (
    <div className="onboarding-container">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>
            Step {progress.currentStepNumber} of {progress.totalSteps}
          </span>
          <span>{progress.progress}% complete</span>
        </div>
        <ProgressBar />
      </div>

      {/* Step content */}
      <div className="mb-6">
        {isWelcomeStep && <WelcomeStep onNext={navigation.nextStep} />}

        {isProfileCreationStep && (
          <ProfileCreationStep
            onCreateProfile={profile.createProfile}
            isLoading={profile.isCreatingProfile}
            error={profile.profileCreationError}
          />
        )}

        {isCompletionStep && (
          <CompletionStep
            onComplete={lifecycle.completeOnboarding}
            onSkip={lifecycle.skipOnboarding}
            profileData={{ displayName: 'Test User' }}
          />
        )}
      </div>

      {/* Navigation */}
      <NavigationButtons />
    </div>
  );
}

// ================
// MIGRATION PATTERN
// ================

// Old way (monolithic hook):
// const onboarding = useOnboarding(config);
// const { state, navigation, profile, lifecycle, progress } = onboarding;

// New way (component-based):
// const { state, setCurrentStep } = useOnboardingState();
// const navigation = useOnboardingNavigation(state, setCurrentStep);
// const profile = useOnboardingProfile(queryClient);
// const lifecycle = useOnboardingLifecycle(state, setActive, setCompleted, config, callbacks);
// const progress = useOnboardingProgress(state);

// Benefits:
// - Each hook has single responsibility
// - Components can use only what they need
// - Better performance (focused re-renders)
// - Easier testing and maintenance
// - Clearer dependencies and data flow
