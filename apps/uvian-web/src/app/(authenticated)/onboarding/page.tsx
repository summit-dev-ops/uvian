'use client';

import React from 'react';
import { OnboardingContainer } from '~/components/features/onboarding/components/onboarding-container';

/**
 * OnboardingPage - Route component for onboarding flow
 *
 * Simple page component that renders the onboarding container.
 * Follows established patterns but without breadcrumbs/actions as requested.
 * This page is for authenticated users who need to complete their profile.
 */
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <OnboardingContainer
        onComplete={() => (window.location.href = '/home')}
        onSkip={() => (window.location.href = '/home')}
        onGoHome={() => (window.location.href = '/')}
        enableSkip={true}
        enableBackNavigation={true}
        autoProgressOnComplete={true}
      />
    </div>
  );
}
