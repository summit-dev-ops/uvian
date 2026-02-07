'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileView as ProfileViewComponent } from '../ProfileView';
import { ProfileEditor } from '../ProfileEditor';
import { useProfile } from '../../hooks/use-profile';
import { useProfileEdit } from '../../hooks/use-profile-edit';

export function ProfileView() {
  const router = useRouter();
  const { isLoadingProfile, profileError, hasProfile } = useProfile();
  const { isEditingProfile, stopEditingProfile } = useProfileEdit();

  // Handle navigation back to previous page
  const handleBack = () => {
    router.back();
  };

  // Handle successful save
  const handleSave = () => {
    stopEditingProfile();
    // Could show a success toast here
  };

  // Handle cancel editing
  const handleCancel = () => {
    stopEditingProfile();
  };

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
          <button
            onClick={handleBack}
            className="w-full px-4 py-2 border rounded-md hover:bg-accent"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isEditingProfile ? (
        <ProfileEditor
          onSave={handleSave}
          onCancel={handleCancel}
          showAvatarUrlField={true}
        />
      ) : (
        <ProfileViewComponent
          showEditButton={hasProfile}
          showSettingsButton={true}
          compact={false}
        />
      )}
    </div>
  );
}
