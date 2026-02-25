'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import type { OnboardingState, OnboardingConfig } from '../types';

const DEFAULT_CONFIG: Required<OnboardingConfig> = {
  enableSkip: true,
  enableBackNavigation: true,
  autoProgressOnComplete: true,
  requireProfileType: true,
  showAvatarUpload: true,
};

/**
 * useOnboardingLifecycle - Lifecycle actions hook
 *
 * Handles onboarding lifecycle events like start, complete, and skip.
 * Takes state management functions and router as explicit dependencies.
 *
 * @param state - Current onboarding state
 * @param setActive - Function to set onboarding active state
 * @param setCompleted - Function to set onboarding completion state
 * @param config - Lifecycle configuration options
 * @param callbacks - Optional callback functions for completion actions
 *
 * @returns Lifecycle interface with action handlers
 */
export function useOnboardingLifecycle(
  state: OnboardingState,
  setActive: (active: boolean) => void,
  setCompleted: (completed: boolean) => void,
  config: OnboardingConfig = {},
  callbacks: {
    onComplete?: () => void;
    onSkip?: () => void;
  } = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const router = useRouter();

  // Start onboarding flow
  const startOnboarding = React.useCallback(() => {
    setActive(true);
  }, [setActive]);

  // Complete onboarding
  const completeOnboarding = React.useCallback(() => {
    setCompleted(true);

    // Execute completion callbacks
    if (callbacks.onComplete) {
      callbacks.onComplete();
    }

    // Auto-navigate if enabled
    if (finalConfig.autoProgressOnComplete) {
      router.push('/home');
    }
  }, [
    router,
    finalConfig.autoProgressOnComplete,
    setCompleted,
    callbacks.onComplete,
  ]);

  // Skip onboarding
  const skipOnboarding = React.useCallback(() => {
    if (!finalConfig.enableSkip) return;

    setCompleted(true);

    // Execute skip callbacks
    if (callbacks.onSkip) {
      callbacks.onSkip();
    }

    // Navigate away
    router.push('/dashboard');
  }, [router, finalConfig.enableSkip, callbacks.onSkip, setCompleted]);

  // Reset onboarding state
  const resetOnboarding = React.useCallback(() => {
    setActive(false);
    setCompleted(false);
  }, [setActive, setCompleted]);

  // Utility calculations
  const canStart = React.useMemo(() => {
    return !state.isActive && !state.isCompleted;
  }, [state.isActive, state.isCompleted]);

  const canComplete = React.useMemo(() => {
    return state.isActive && !state.isCompleted;
  }, [state.isActive, state.isCompleted]);

  const canSkip = React.useMemo(() => {
    return state.isActive && !state.isCompleted && finalConfig.enableSkip;
  }, [state.isActive, state.isCompleted, finalConfig.enableSkip]);

  const lifecycleStatus = React.useMemo(() => {
    if (state.isCompleted) return 'completed';
    if (state.isActive) return 'active';
    return 'idle';
  }, [state.isActive, state.isCompleted]);

  return {
    // Lifecycle actions
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,

    // State checks
    canStart,
    canComplete,
    canSkip,

    // Status information
    lifecycleStatus,
    isCompleted: state.isCompleted,
    isActive: state.isActive,
  };
}
