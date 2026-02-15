'use client';

import * as React from 'react';

import type { OnboardingState, OnboardingConfig } from '../types';

const STEP_PROGRESS = {
  welcome: 0,
  'profile-creation': 50,
  completion: 100,
} as const;

const DEFAULT_CONFIG: Required<OnboardingConfig> = {
  enableSkip: true,
  enableBackNavigation: true,
  autoProgressOnComplete: true,
  requireProfileType: true,
  showAvatarUpload: true,
};

/**
 * useOnboardingProgress - Progress calculations hook
 *
 * Calculates onboarding progress percentages and provides
 * progress-related utilities. Takes state as explicit dependency.
 *
 * @param state - Current onboarding state
 * @param config - Progress configuration options
 *
 * @returns Progress interface with calculated values
 */
export function useOnboardingProgress(
  state: OnboardingState,
  config: OnboardingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Calculate overall progress percentage
  const progress = React.useMemo(() => {
    return STEP_PROGRESS[state.currentStep] || 0;
  }, [state.currentStep]);

  // Calculate step-specific progress
  const currentStepProgress = React.useMemo(() => {
    switch (state.currentStep) {
      case 'welcome':
        return 25; // In the middle of welcome step
      case 'profile-creation':
        return 75; // In the middle of profile creation
      case 'completion':
        return 100; // Complete
      default:
        return 0;
    }
  }, [state.currentStep]);

  // Calculate total steps
  const totalSteps = 3; // welcome, profile-creation, completion

  // Calculate current step number (1-indexed)
  const currentStepNumber = React.useMemo(() => {
    const stepOrder = Object.keys(STEP_PROGRESS) as Array<
      keyof typeof STEP_PROGRESS
    >;
    return stepOrder.indexOf(state.currentStep) + 1;
  }, [state.currentStep]);

  // Calculate completion percentage
  const completionPercentage = React.useMemo(() => {
    if (state.isCompleted) return 100;
    return Math.round((currentStepNumber / totalSteps) * 100);
  }, [currentStepNumber, totalSteps, state.isCompleted]);

  // Calculate remaining steps
  const remainingSteps = React.useMemo(() => {
    return totalSteps - currentStepNumber;
  }, [currentStepNumber, totalSteps]);

  // Navigation permissions based on progress
  const canProceedToNext = React.useMemo(() => {
    return currentStepNumber < totalSteps;
  }, [currentStepNumber, totalSteps]);

  const canGoBack = React.useMemo(() => {
    if (!finalConfig.enableBackNavigation) return false;
    return currentStepNumber > 1;
  }, [currentStepNumber, finalConfig.enableBackNavigation]);

  const canSkip = React.useMemo(() => {
    return finalConfig.enableSkip && !state.isCompleted;
  }, [finalConfig.enableSkip, state.isCompleted]);

  // Progress milestones
  const progressMilestones = React.useMemo(() => {
    return {
      welcome: progress >= 0,
      'profile-creation': progress >= 50,
      completion: progress >= 100,
    };
  }, [progress]);

  // Progress indicators
  const progressIndicators = React.useMemo(() => {
    return {
      showWelcome: state.currentStep === 'welcome',
      showProfileCreation:
        state.currentStep === 'profile-creation' || progress >= 50,
      showCompletion: state.currentStep === 'completion' || progress >= 100,
    };
  }, [state.currentStep, progress]);

  // Progress categories
  const progressCategory = React.useMemo(() => {
    if (state.isCompleted) return 'completed';
    if (progress === 0) return 'not-started';
    if (progress < 50) return 'in-progress';
    if (progress < 100) return 'near-complete';
    return 'complete';
  }, [progress, state.isCompleted]);

  // ETA calculations (rough estimates)
  const estimatedTimeRemaining = React.useMemo(() => {
    if (state.isCompleted) return 0;
    if (progress === 0) return 120; // 2 minutes estimate
    if (progress < 50) return 60; // 1 minute
    if (progress < 100) return 30; // 30 seconds
    return 0;
  }, [progress, state.isCompleted]);

  return {
    // Core progress values
    progress,
    currentStepProgress,
    completionPercentage,

    // Step information
    currentStepNumber,
    totalSteps,
    remainingSteps,

    // Navigation permissions
    canProceedToNext,
    canGoBack,
    canSkip,

    // Milestone tracking
    progressMilestones,
    progressIndicators,

    // Status information
    progressCategory,

    // Time estimates
    estimatedTimeRemaining,

    // Raw state for debugging
    currentStep: state.currentStep,
    isActive: state.isActive,
    isCompleted: state.isCompleted,
  };
}
