'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileView } from '~/components/features/user/components/ProfileView';
import { ProfileEditor } from '~/components/features/user/components/ProfileEditor';
import { useProfile } from '~/components/features/user/hooks/use-profile';
import { useProfileEdit } from '~/components/features/user/hooks/use-profile-edit';
import { Button, Card } from '@org/ui';
import { Edit3, ArrowLeft, Settings } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isLoadingProfile, profileError, hasProfile } = useProfile();

  const {
    isEditingProfile,
    startEditingProfile,
    stopEditingProfile,
    loadCurrentDataIntoDrafts,
  } = useProfileEdit();

  // Handle navigation back to previous page
  const handleBack = () => {
    router.back();
  };

  // Handle edit mode toggle
  const handleStartEditing = () => {
    if (profile) {
      loadCurrentDataIntoDrafts({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        publicFields: profile.publicFields,
      });
    }
    startEditingProfile();
  };

  // Handle successful save
  const handleSave = () => {
    stopEditingProfile();
    // Could show a success toast here
  };

  // Handle cancel
  const handleCancel = () => {
    stopEditingProfile();
  };

  // Loading state while checking authentication
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Profile</h1>
          </div>
        </header>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state (authentication issue)
  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Settings className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Authentication Required</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to view your profile.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            <Button onClick={handleBack} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <Button onClick={handleBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditingProfile ? 'Edit Profile' : 'Profile'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {hasProfile && !isEditingProfile && (
            <Button onClick={handleStartEditing} size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        {isEditingProfile ? (
          <ProfileEditor
            onSave={handleSave}
            onCancel={handleCancel}
            showAvatarUrlField={true}
          />
        ) : (
          <ProfileView
            showEditButton={hasProfile}
            showSettingsButton={true}
            compact={false}
          />
        )}
      </div>
    </div>
  );
}
