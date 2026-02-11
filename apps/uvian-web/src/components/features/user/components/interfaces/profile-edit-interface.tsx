'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileEditor } from '../profile-editor';
import { Button, ScrollArea } from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api';

export function ProfileEditInterface({profileId}: {profileId?:string}) {
  const router = useRouter();
  const { isLoading: isLoadingProfile, error: profileError } = useQuery(userQueries.profile(profileId));


  // Handle navigation back to profile page
  const handleBack = () => {
    router.push(`/profiles/${profileId}`);
  };

  // Handle successful save
  const handleSave = () => {
    router.push(`/profiles/${profileId}`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/profiles/${profileId}`);
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-t-primary border-primary/30 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading profile editor...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <div className="h-8 w-8 bg-destructive/30 rounded" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Error Loading Profile</h2>
          <p className="text-muted-foreground mt-2">
            {profileError.message ||
              'Something went wrong loading your profile.'}
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </Button>
          <Button
            onClick={handleBack}
            className="w-full px-4 py-2 border rounded-md hover:bg-accent"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <ProfileEditor
        profileId={profileId}
        className='p-2'
        onSave={handleSave}
        onCancel={handleCancel}
        showAvatarUrlField={true}
      />
    </ScrollArea>
  );
}
