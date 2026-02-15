// Onboarding Hooks - Component-Based Architecture
//
// This directory contains focused hooks for onboarding functionality.
// Each hook has single responsibility and can be composed as needed.

export { useOnboardingState } from './use-onboarding-state';
export { useOnboardingEligibility } from './use-onboarding-eligibility';
export { useOnboardingNavigation } from './use-onboarding-navigation';
export { useOnboardingProfile } from './use-onboarding-profile';
export { useOnboardingLifecycle } from './use-onboarding-lifecycle';
export { useOnboardingProgress } from './use-onboarding-progress';

// Legacy compatibility
export { useOnboarding } from './use-onboarding';
