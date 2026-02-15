'use client';

import * as React from 'react';

import type {
  OnboardingState,
  OnboardingStep,
  OnboardingConfig,
} from '../types';

const DEFAULT_CONFIG: Required<OnboardingConfig> = {
  enableSkip: true,
  enableBackNavigation: true,
  autoProgressOnComplete: true,
  requireProfileType: true,
  showAvatarUpload: true,
};

// Order of steps for navigation
const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'profile-creation',
  'completion',
];

/**
 * useOnboardingNavigation - Step navigation hook
 *
 * Provides navigation methods for moving between onboarding steps.
 * Takes state and navigation setter as explicit dependencies for decoupling.
 *
 * @param state - Current onboarding state
 * @param setCurrentStep - Function to update current step (from useOnboardingState)
 * @param config - Navigation configuration options
 *
 * @returns Navigation interface with step movement methods
 */
export function useOnboardingNavigation(
  state: OnboardingState,
  setCurrentStep: (step: OnboardingStep) => void,
  config: OnboardingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Navigation methods
  const goToStep = React.useCallback(
    (step: OnboardingStep) => {
      // Only allow navigation to valid steps
      if (STEP_ORDER.includes(step)) {
        setCurrentStep(step);
      }
    },
    [setCurrentStep]
  );

  const nextStep = React.useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
    const nextStep = STEP_ORDER[nextIndex];

    if (nextStep !== state.currentStep) {
      setCurrentStep(nextStep);
    }
  }, [state.currentStep, setCurrentStep]);

  const previousStep = React.useCallback(() => {
    if (!finalConfig.enableBackNavigation) return;

    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    const prevIndex = Math.max(currentIndex - 1, 0);
    const prevStep = STEP_ORDER[prevIndex];

    if (prevStep !== state.currentStep) {
      setCurrentStep(prevStep);
    }
  }, [state.currentStep, finalConfig.enableBackNavigation, setCurrentStep]);

  // Navigation state calculations
  const canProceedToNext = React.useMemo(() => {
    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    return currentIndex < STEP_ORDER.length - 1;
  }, [state.currentStep]);

  const canGoBack = React.useMemo(() => {
    if (!finalConfig.enableBackNavigation) return false;

    const currentIndex = STEP_ORDER.indexOf(state.currentStep);
    return currentIndex > 0;
  }, [state.currentStep, finalConfig.enableBackNavigation]);

  const isFirstStep = React.useMemo(() => {
    return state.currentStep === 'welcome';
  }, [state.currentStep]);

  const isLastStep = React.useMemo(() => {
    return state.currentStep === 'completion';
  }, [state.currentStep]);

  const currentStepIndex = React.useMemo(() => {
    return STEP_ORDER.indexOf(state.currentStep);
  }, [state.currentStep]);

  return {
    // Navigation methods
    goToStep,
    nextStep,
    previousStep,

    // Navigation state
    canProceedToNext,
    canGoBack,
    isFirstStep,
    isLastStep,

    // Step information
    currentStepIndex,
    totalSteps: STEP_ORDER.length,
    currentStep: state.currentStep,
  };
}
