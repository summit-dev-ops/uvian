'use client';

import * as React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Bot,
  Settings,
  CheckCircle,
  User,
  Home,
} from 'lucide-react';

import { Button } from '@org/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@org/ui';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import { OnboardingProfileForm } from '../forms/onboarding-profile-form';
import type { OnboardingFormData } from '../../types';

export interface OnboardingInterfaceProps {
  // State
  currentStep: 'welcome' | 'profile-creation' | 'completion';
  progress: number;
  isLoading?: boolean;
  error?: Error | null;

  // Profile data for completion step
  profileData?: {
    displayName?: string;
    type?: 'human' | 'agent' | 'system';
  } | null;

  // Configuration
  enableSkip?: boolean;
  enableBackNavigation?: boolean;

  // Callbacks
  onNext?: () => void;
  onNextWithData?: (data: OnboardingFormData) => void;
  onBack?: () => void;
  onSkip?: () => void;
  onComplete?: () => void;
  onGoHome?: () => void;

  // Optional props
  className?: string;
}

/**
 * OnboardingInterface - Consolidated interface for the complete onboarding flow
 *
 * Renders all onboarding steps in a single interface component following the established
 * feature patterns. Manages step flow and renders appropriate content based on current step.
 * This is a large interface component that encapsulates the entire onboarding experience.
 */
export const OnboardingInterface: React.FC<OnboardingInterfaceProps> = ({
  currentStep,
  progress,
  isLoading = false,
  error = null,
  profileData = null,
  enableSkip = true,
  enableBackNavigation = true,
  onNext,
  onNextWithData,
  onBack,
  onSkip,
  onComplete,
  onGoHome,
  className,
}) => {
  const handleFormSubmit = async (data: {
    displayName: string;
    type: 'human' | 'agent' | 'system';
    bio?: string;
    avatarUrl?: string;
  }) => {
    if (onNextWithData) {
      // Transform to OnboardingFormData format
      const transformedData = {
        ...data,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
      };
      await onNextWithData(transformedData);
    }
  };

  // Welcome Step
  if (currentStep === 'welcome') {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center ${
          className || ''
        }`}
      >
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to UVian
            </CardTitle>

            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              Let's get you set up with your profile so you can make the most of
              your experience.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Feature highlights */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Connect</h4>
                  <p className="text-xs text-muted-foreground">
                    Create and manage your professional identity
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">AI Assistant</h4>
                  <p className="text-xs text-muted-foreground">
                    Interact with intelligent agents and systems
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/30 sm:col-span-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Customize</h4>
                  <p className="text-xs text-muted-foreground">
                    Configure your experience with personalized settings
                  </p>
                </div>
              </div>
            </div>

            {/* Process overview */}
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <h4 className="font-semibold text-sm mb-2">
                Quick Setup Process
              </h4>
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Welcome</span>
                </div>
                <div className="w-4 h-px bg-border"></div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
                  <span>Profile</span>
                </div>
                <div className="w-4 h-px bg-border"></div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
                  <span>Complete</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Takes less than 2 minutes
            </div>

            <div className="flex gap-3">
              {enableSkip && onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="min-w-[80px]"
                >
                  Skip for now
                </Button>
              )}

              <Button
                onClick={onNext}
                className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Profile Creation Step
  if (currentStep === 'profile-creation') {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center ${
          className || ''
        }`}
      >
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold">
              Create Your Profile
            </CardTitle>

            <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
              Let's set up your profile so others can find and connect with you.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error display using InterfaceError */}
            {error && (
              <InterfaceError
                variant="card"
                title="Profile Creation Failed"
                message={
                  error.message ||
                  'There was an error creating your profile. Please try again.'
                }
                showIcon={true}
                showRetry={false}
                showHome={false}
              />
            )}

            {/* Loading display using InterfaceLoading */}
            {isLoading && (
              <InterfaceLoading
                variant="card"
                message="Creating your profile..."
                size="default"
              />
            )}

            {/* Profile form - only show when not loading or error */}
            {!isLoading && !error && (
              <OnboardingProfileForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                className="mx-0"
              />
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Your information is secure and private
            </div>

            {enableBackNavigation && onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="min-w-[80px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Completion Step
  const profileTypeLabel = {
    human: 'Human',
    agent: 'Agent',
    system: 'System',
  }[profileData?.type || 'human'];

  return (
    <div
      className={`min-h-[60vh] flex items-center justify-center ${
        className || ''
      }`}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
            You're All Set!
          </CardTitle>

          <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
            {profileData?.displayName
              ? `Welcome ${
                  profileData.displayName
                }! Your ${profileTypeLabel.toLowerCase()} profile has been created successfully.`
              : "Your profile has been created successfully and you're ready to get started!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success highlights */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                What You Can Do Now
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="font-medium text-sm text-green-800 dark:text-green-200">
                  Explore Features
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Discover all the tools available
                </div>
              </div>

              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="font-medium text-sm text-green-800 dark:text-green-200">
                  Connect & Collaborate
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Start building your network
                </div>
              </div>
            </div>
          </div>

          {/* Profile summary */}
          {profileData?.displayName && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-center">
                Your Profile
              </h4>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {profileData.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-center">
                  <div className="font-medium">{profileData.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {profileTypeLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            You can always update your profile later
          </div>

          <div className="flex gap-3">
            {onGoHome && (
              <Button
                variant="outline"
                onClick={onGoHome}
                className="min-w-[100px]"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}

            <Button
              onClick={onComplete}
              className="min-w-[120px] bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Enter UVian
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
