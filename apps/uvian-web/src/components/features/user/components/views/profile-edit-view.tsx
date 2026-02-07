'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileEditor } from '../ProfileEditor';
import { useProfile } from '../../hooks/use-profile';
import { useProfileEdit } from '../../hooks/use-profile-edit';

export function ProfileEditView() {
  const router = useRouter();
  const { profile, isLoadingProfile, profileError, hasProfile } = useProfile();

  const { startEditingProfile, stopEditingProfile, loadCurrentDataIntoDrafts } =
    useProfileEdit();

  // Handle navigation back to profile page
  const handleBack = () => {
    router.push('/profile');
  };

  // Handle successful save
  const handleSave = () => {
    stopEditingProfile();
    router.push('/profile');
  };

  // Handle cancel
  const handleCancel = () => {
    stopEditingProfile();
    router.push('/profile');
  };

  // Initialize editing mode if not already editing
  useEffect(() => {
    if (!isLoadingProfile && !profileError) {
      if (!hasProfile) {
        // New user - start creating profile
        startEditingProfile();
      } else {
        // Existing user - load current profile into drafts
        if (profile) {
          loadCurrentDataIntoDrafts({
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            publicFields: profile.publicFields,
          });
        }
        startEditingProfile();
      }
    }
  }, [
    isLoadingProfile,
    profileError,
    hasProfile,
    profile,
    startEditingProfile,
    loadCurrentDataIntoDrafts,
  ]);

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
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
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
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="px-3 py-2 text-sm hover:bg-accent rounded-md"
        >
          ← Back to Profile
        </button>
      </div>
      <ProfileEditor
        onSave={handleSave}
        onCancel={handleCancel}
        showAvatarUrlField={true}
      />
    </div>
  );
}
