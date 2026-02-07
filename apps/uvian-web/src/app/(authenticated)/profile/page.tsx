'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileView } from '~/components/features/user/components/ProfileView';
import { ProfileEditor } from '~/components/features/user/components/ProfileEditor';
import { useProfile } from '~/components/features/user/hooks/use-profile';
import { useProfileEdit } from '~/components/features/user/hooks/use-profile-edit';
import { Button, Card } from '@org/ui';
import { Settings } from 'lucide-react';

export default function ProfilePage() {
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
      <div className="flex-1 min-h-0 overflow-auto">
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
      <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center">
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
    <div className="flex-1 min-h-0 overflow-auto">
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
