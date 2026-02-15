/**
 * Onboarding Feature Types
 * 
 * Local feature types that bridge UI with existing profile domain
 * Follows the established pattern of local types that complement domain types
 */

export type OnboardingStep = 'welcome' | 'profile-creation' | 'completion';

export type OnboardingState = {
  currentStep: OnboardingStep;
  isActive: boolean;
  hasStarted: boolean;
  isCompleted: boolean;
  profileId?: string;
};

export type OnboardingProfileData = {
  displayName: string;
  type: 'human' | 'agent' | 'system';
  bio?: string;
  avatarUrl?: string;
};

export type OnboardingContextValue = {
  // State
  state: OnboardingState;
  
  // Navigation
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Profile creation
  createProfile: (data: OnboardingProfileData) => Promise<{ profileId: string }>;
  isCreatingProfile: boolean;
  profileCreationError?: Error | null;
  
  // Lifecycle
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  
  // Utility
  needsOnboarding: boolean;
  canProceedToNext: boolean;
  canGoBack: boolean;
  progress: number; // 0-100
};

export type OnboardingFormData = {
  displayName: string;
  type: 'human' | 'agent' | 'system';
  bio: string;
  avatarUrl: string;
};

export type OnboardingNavigationOptions = {
  replaceHistory?: boolean;
  preventAutoRedirect?: boolean;
};

export type OnboardingConfig = {
  enableSkip?: boolean;
  enableBackNavigation?: boolean;
  autoProgressOnComplete?: boolean;
  requireProfileType?: boolean;
  showAvatarUpload?: boolean;
};
