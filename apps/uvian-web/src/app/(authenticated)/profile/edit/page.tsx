'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfileEditor } from '~/components/features/user/components/ProfileEditor';
import { useProfile } from '~/components/features/user/hooks/use-profile';
import { useProfileEdit } from '~/components/features/user/hooks/use-profile-edit';
import { Button } from '@org/ui';
import { ArrowLeft, User } from 'lucide-react';

export default function ProfileEditPage() {
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
  React.useEffect(() => {
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
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">
              {hasProfile ? 'Edit Profile' : 'Create Profile'}
            </h1>
          </div>
        </header>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-t-primary border-primary/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Loading profile editor...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Profile</h1>
            <p className="text-muted-foreground mt-2">
              {profileError.message ||
                'Something went wrong loading your profile.'}
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
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
            {hasProfile ? 'Edit Profile' : 'Create Profile'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              View Profile
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <ProfileEditor
          onSave={handleSave}
          onCancel={handleCancel}
          showAvatarUrlField={true}
        />
      </div>
    </div>
  );
}
