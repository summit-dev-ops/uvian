'use client';

import * as React from 'react';

import type { OnboardingState, OnboardingStep } from '../types';

const INITIAL_STATE: OnboardingState = {
  currentStep: 'welcome',
  isActive: false,
  hasStarted: false,
  isCompleted: false,
};

/**
 * useOnboardingState - Core state management hook
 *
 * Manages the fundamental onboarding state including current step,
 * activity status, completion flags, and profile ID.
 *
 * Dependencies: None (base state hook)
 *
 * @returns State management interface with current state and setters
 */
export function useOnboardingState() {
  const [state, setState] = React.useState<OnboardingState>(INITIAL_STATE);

  // Setters for state management
  const setCurrentStep = React.useCallback((step: OnboardingStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const setActive = React.useCallback((active: boolean) => {
    setState((prev) => ({
      ...prev,
      isActive: active,
      hasStarted: active ? true : prev.hasStarted,
    }));
  }, []);

  const setCompleted = React.useCallback((completed: boolean) => {
    setState((prev) => ({
      ...prev,
      isCompleted: completed,
      isActive: !completed ? true : false,
    }));
  }, []);

  const setProfileId = React.useCallback((profileId: string) => {
    setState((prev) => ({
      ...prev,
      profileId,
    }));
  }, []);

  // Derived state for convenience
  const isWelcomeStep = state.currentStep === 'welcome';
  const isProfileCreationStep = state.currentStep === 'profile-creation';
  const isCompletionStep = state.currentStep === 'completion';

  return {
    // Core state
    state,

    // State setters
    setCurrentStep,
    setActive,
    setCompleted,
    setProfileId,

    // Derived state for convenience
    isWelcomeStep,
    isProfileCreationStep,
    isCompletionStep,
  };
}
