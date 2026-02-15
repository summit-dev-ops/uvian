'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProfileEditor } from '../profile-editor';
import { InterfaceError } from '~/components/shared/ui/interfaces/interface-error';
import { InterfaceLoading } from '~/components/shared/ui/interfaces/interface-loading';
import {  ScrollArea } from '@org/ui';
import { useQuery } from '@tanstack/react-query';
import { profileQueries } from '~/lib/domains/profile/api';

export function ProfileEditInterface({ profileId }: { profileId?: string }) {
  const router = useRouter();
  const { isLoading: isLoadingProfile, error: profileError } = useQuery(
    profileQueries.profile(profileId)
  );

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
      <InterfaceLoading
        variant="default"
        message="Loading profile editor..."
        size="default"
        className="flex items-center justify-center py-12"
      />
    );
  }

  // Error state
  if (profileError) {
    return (
      <InterfaceError
        variant="card"
        title="Error Loading Profile"
        message={
          profileError.message || 'Something went wrong loading your profile.'
        }
        showRetry={true}
        showHome={true}
        onRetry={() => window.location.reload()}
        className="text-center space-y-6 max-w-md mx-auto p-6"
      />
    );
  }

  return (
    <ScrollArea className="flex-1">
      <ProfileEditor
        profileId={profileId}
        className="p-2"
        onSave={handleSave}
        onCancel={handleCancel}
        showAvatarUrlField={true}
      />
    </ScrollArea>
  );
}
