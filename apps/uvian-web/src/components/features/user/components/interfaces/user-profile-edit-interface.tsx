'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  InterfaceLayout,
  InterfaceHeader,
  InterfaceHeaderContent,
  InterfaceContent,
  InterfaceContainer,
} from '~/components/shared/ui/interfaces/interface-layout';
import {
  InterfaceError,
  InterfaceLoading,
} from '~/components/shared/ui/interfaces';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userQueries } from '~/lib/domains/user/api/queries';
import { profileMutations } from '~/lib/domains/profile/api';
import { ProfileForm } from '~/components/features/profiles/components/forms/profile-form';
import { Button } from '@org/ui';

interface UserProfileEditInterfaceProps {
  userId: string;
  profileId?: string;
}

export function UserProfileEditInterface({
  userId,
  profileId,
}: UserProfileEditInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch,
  } = useQuery(userQueries.profileByUserId(userId));

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation(
    profileMutations.updateProfile(queryClient)
  );

  const isNewProfile = !profileId && !profile;

  const handleSubmit = React.useCallback(
    async (formData: {
      displayName: string;
      avatarUrl?: string;
      bio?: string;
      publicFields?: Record<string, unknown>;
    }) => {
      const targetProfileId = profile?.id || profileId;
      if (!targetProfileId) {
        throw new Error('No profile to update');
      }
      return new Promise<void>((resolve, reject) => {
        updateProfile(
          { profileId: targetProfileId, ...formData },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ['profiles'] });
              router.push(`/users/${userId}`);
              resolve();
            },
            onError: (error) => {
              console.error('Profile save failed:', error);
              reject(error);
            },
          }
        );
      });
    },
    [updateProfile, profileId, profile, userId, queryClient, router]
  );

  const handleCancel = React.useCallback(() => {
    router.push(`/users/${userId}`);
  }, [router, userId]);

  if (isLoadingProfile) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title={isNewProfile ? 'Create Profile' : 'Edit Profile'}
            subtitle="Loading..."
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceLoading message="Loading..." />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  if (profileError && !isNewProfile) {
    return (
      <InterfaceLayout>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title="Edit Profile"
            subtitle="Error"
            actions={
              <Button variant="outline" onClick={() => router.push('/users')}>
                Back to Users
              </Button>
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <InterfaceError
            title="Failed to Load Profile"
            message={profileError.message || 'Something went wrong.'}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </InterfaceContent>
      </InterfaceLayout>
    );
  }

  const formInitialData = {
    displayName: profile?.displayName || '',
    avatarUrl: profile?.avatarUrl || '',
    coverUrl: profile?.coverUrl || '',
    bio: profile?.bio || '',
    publicFields: profile?.publicFields || {},
  };

  return (
    <InterfaceLayout>
      <InterfaceContainer>
        <InterfaceHeader spacing="compact">
          <InterfaceHeaderContent
            title={isNewProfile ? 'Create Profile' : 'Edit Profile'}
            subtitle={
              isNewProfile
                ? 'Create a new profile'
                : 'Update profile information'
            }
          />
        </InterfaceHeader>
        <InterfaceContent spacing="default">
          <ProfileForm
            mode={isNewProfile ? 'create' : 'edit'}
            isLoading={isUpdatingProfile}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={formInitialData}
          />
        </InterfaceContent>
      </InterfaceContainer>
    </InterfaceLayout>
  );
}
