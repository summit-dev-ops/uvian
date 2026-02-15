'use client';

import * as React from 'react';

import { OnboardingInterface } from './interfaces/onboarding-interface';
import { useOnboarding } from '../hooks/use-onboarding';
import type { OnboardingFormData, OnboardingProfileData } from '../types';

export interface OnboardingContainerProps {
  // Callbacks
  onComplete?: () => void;
  onSkip?: () => void;
  onGoHome?: () => void;

  // Configuration
  enableSkip?: boolean;
  enableBackNavigation?: boolean;
  autoProgressOnComplete?: boolean;

  // Optional props
  className?: string;
}

/**
 * OnboardingContainer - Main container for the onboarding flow
 *
 * Orchestrates the entire onboarding experience by delegating state management
 * to the useOnboarding hook and rendering the OnboardingInterface component.
 * This component serves as the integration point for the onboarding feature.
 */
export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onComplete,
  onSkip,
  onGoHome,
  enableSkip = true,
  enableBackNavigation = true,
  autoProgressOnComplete = true,
  className,
}) => {
  const onboarding = useOnboarding({
    enableSkip,
    enableBackNavigation,
    autoProgressOnComplete,
  });

  // Store profile data for completion page
  const [profileData, setProfileData] =
    React.useState<OnboardingProfileData | null>(null);

  const handleWelcomeNext = () => {
    onboarding.startOnboarding();
    onboarding.nextStep();
  };

  const handleProfileNext = async (data: OnboardingFormData) => {
    try {
      // Transform form data to onboarding profile data
      const onboardingProfileData: OnboardingProfileData = {
        displayName: data.displayName,
        type: data.type,
        bio: data.bio || undefined,
        avatarUrl: data.avatarUrl || undefined,
      };

      // Store for completion page
      setProfileData(onboardingProfileData);

      await onboarding.createProfile(onboardingProfileData);
      onboarding.nextStep();
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Failed to create profile during onboarding:', error);
    }
  };

  const handleCompletion = () => {
    onboarding.completeOnboarding();
    onComplete?.();
  };

  const handleGoHome = () => {
    onGoHome?.();
  };

  // Show progress indicator if onboarding is active
  const showProgress = onboarding.state.isActive || onboarding.state.hasStarted;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 ${
        className || ''
      }`}
    >
      {/* Progress indicator */}
      {showProgress && (
        <div className="w-full bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Step{' '}
                {onboarding.state.currentStep === 'welcome'
                  ? '1'
                  : onboarding.state.currentStep === 'profile-creation'
                  ? '2'
                  : '3'}{' '}
                of 3
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(onboarding.progress)}% Complete
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${onboarding.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <OnboardingInterface
          currentStep={onboarding.state.currentStep}
          progress={onboarding.progress}
          isLoading={onboarding.isCreatingProfile}
          error={onboarding.profileCreationError}
          profileData={profileData}
          enableSkip={enableSkip}
          enableBackNavigation={enableBackNavigation}
          onNext={handleWelcomeNext}
          onNextWithData={handleProfileNext}
          onBack={onboarding.previousStep}
          onSkip={onboarding.skipOnboarding}
          onComplete={handleCompletion}
          onGoHome={handleGoHome}
        />
      </div>
    </div>
  );
};
