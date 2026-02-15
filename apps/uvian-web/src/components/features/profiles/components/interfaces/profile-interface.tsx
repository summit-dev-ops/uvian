'use client';

import React from 'react';
import { ProfileView } from '../profile-view';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoadingSkeleton } from '~/components/shared/ui/interfaces/interface-loading';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api';

// Import new layout components
import {
  InterfaceLayout,
  InterfaceContainer,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceSection,
} from '~/components/shared/ui/interfaces/interface-layout';

export function ProfileInterface({ profileId }: { profileId?: string }) {
  const { isLoading: isLoadingProfile, error: profileError } = useQuery(
    profileQueries.profile(profileId)
  );

  // Loading state while checking authentication
  if (isLoadingProfile) {
    return (
      <InterfaceLayout>
        <InterfaceContainer variant="card" size="default">
          <InterfaceHeader>
            <InterfaceHeaderContent title="Profile Details" />
          </InterfaceHeader>
          <InterfaceContent>
            <InterfaceSection variant="card">
              <InterfaceLoadingSkeleton
                variant="default"
                lines={4}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </InterfaceLoadingSkeleton>
            </InterfaceSection>
          </InterfaceContent>
        </InterfaceContainer>
      </InterfaceLayout>
    );
  }

  // Error state (authentication issue)
  if (profileError) {
    return (
      <InterfaceError
        variant="card"
        title="Authentication Required"
        message="You need to be signed in to view your profile."
        showRetry={true}
        showHome={false}
        onRetry={() => window.location.reload()}
        className="text-center space-y-6 max-w-md mx-auto p-6"
      />
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceContainer variant="card" size="default">
        <InterfaceHeader>
          <InterfaceHeaderContent
            title="Profile Details"
            actions={
              // TODO: Add edit profile functionality when needed
              <></>
            }
          />
        </InterfaceHeader>
        <InterfaceContent>
          <InterfaceSection variant="card">
            <ProfileView
              profileId={profileId}
              className="p-4"
              showEditButton={true}
              showSettingsButton={true}
              compact={false}
            />
          </InterfaceSection>
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
