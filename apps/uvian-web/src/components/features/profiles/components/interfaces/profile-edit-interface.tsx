'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileMutations, profileQueries } from '~/lib/domains/profile/api';
import { ProfileForm } from '../forms/profile-form';

export function ProfileEditInterface({ profileId }: { profileId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: isLoadingProfile, error: profileError } = useQuery(
    profileQueries.profile(profileId)
  );

  // Handle successful save
  const handleSave = () => {
    router.push(`/profiles/${profileId}`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/profiles/${profileId}`);
  };

  const { data: profile } = useQuery(profileQueries.profile(profileId));
  const { mutate: handleUpdateProfile, isPending: isUpdatingProfile } =
    useMutation(profileMutations.updateProfile(queryClient));
  const { mutate: handleCreateProfile, isPending: isCreatingProfile } =
    useMutation(profileMutations.createProfile(queryClient));

  // Merge profile data with initialData for form
  const formInitialData = {
    displayName: profile?.displayName || profile?.displayName || '',
    avatarUrl: profile?.avatarUrl || profile?.avatarUrl || '',
    bio: profile?.bio || profile?.bio || '',
    publicFields: profile?.publicFields || profile?.publicFields || {},
  };

  const handleSubmit = async (formData: {
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    publicFields?: Record<string, any>;
  }) => {
    try {
      // Determine whether to update or create based on existing profile
      if (profile && profileId) {
        await handleUpdateProfile({ profileId, ...formData });
      } else {
        await handleCreateProfile(formData);
      }

      // Success - call onSave callback
      handleSave();
    } catch (error) {
      console.error('Profile save failed:', error);
    }
  };

  const isUpdating = isUpdatingProfile || isCreatingProfile;

  // Early return for loading state
  if (isLoadingProfile) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Profile"
            subtitle="Loading profile editor..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading
            variant="default"
            message="Loading profile editor..."
            size="lg"
            className="min-h-[400px]"
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  // Early return for error state
  if (profileError) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Profile"
            subtitle="Error loading profile"
            actions={
              <button
                onClick={() => router.push(`/profiles/${profileId}`)}
                className="px-3 py-1 text-sm border rounded hover:bg-accent"
              >
                Back to Profile
              </button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            variant="card"
            title="Error Loading Profile"
            message={
              profileError.message ||
              'Something went wrong loading your profile.'
            }
            showRetry={true}
            showHome={true}
            onRetry={() => window.location.reload()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  return (
    <InterfaceLayout>
      <InterfaceHeader spacing="compact">
        <InterfaceHeaderContent
          title="Edit Profile"
          subtitle="Update your profile information"
        />
      </InterfaceHeader>
      <InterfaceContent spacing="default">
        <ProfileForm
          mode="edit"
          isLoading={isUpdating}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={formInitialData}
        />
      </InterfaceContent>
    </InterfaceLayout>
  );
}
