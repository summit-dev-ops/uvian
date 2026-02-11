'use client';

import React from 'react';
import { ProfileView } from '../profile-view';
import { ScrollArea } from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api';

export function ProfileInterface({ profileId }: { profileId?: string }) {

  const { isLoading: isLoadingProfile, error: profileError } = useQuery(userQueries.profile(profileId));


  // Loading state while checking authentication
  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Error state (authentication issue)
  if (profileError) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <div className="h-8 w-8 bg-destructive/30 rounded" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground mt-2">
            You need to be signed in to view your profile.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <ProfileView
        profileId={profileId}
        className='p-4'
        showEditButton={true}
        showSettingsButton={true}
        compact={false}
      />
    </ScrollArea>
  );
}
