'use client';

import React from 'react';
import { ProfileForm } from './forms/profile-form';
import type { ProfileDraft } from '~/lib/domains/user/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userMutations, userQueries } from '~/lib/domains/user/api';

// Optimized prop interface
interface ProfileEditorProps {
  profileId?:string,
  // Callbacks
  onSave?: () => void;
  onCancel?: () => void;

  // Optional props
  showAvatarUrlField?: boolean;
  className?: string;

  // For backward compatibility, accept initial data
  initialData?: Partial<ProfileDraft>;
}

/**
 * ProfileEditor - Data-aware wrapper that handles business logic and uses ProfileForm
 * Separates data fetching/mutation logic from form rendering
 */
export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profileId,
  onSave,
  onCancel,
  initialData,
  showAvatarUrlField = true,
  className,
}) => {
  const queryClient = useQueryClient()
  const { data: profile } = useQuery(userQueries.profile(profileId));
  const {mutate: handleUpdateProfile, isPending: isUpdatingProfile } = useMutation(userMutations.updateProfile(queryClient))
  const {mutate: handleCreateProfile, isPending: isCreatingProfile } = useMutation(userMutations.createProfile(queryClient))


  // Determine mode based on existing profile
  const mode = !!profile ? "edit" : "create"

  // Merge profile data with initialData for form
  const formInitialData = {
    displayName: profile?.displayName || initialData?.displayName || '',
    avatarUrl: profile?.avatarUrl || initialData?.avatarUrl || '',
    bio: profile?.bio || initialData?.bio || '',
    publicFields: profile?.publicFields || initialData?.publicFields || {},
  };

  const handleSubmit = async (formData: {
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    publicFields?: Record<string, any>;
  }) => {
    try {
      // Determine whether to update or create based on existing profile
      if (!!profile) {
        await handleUpdateProfile(formData);
      } else {
        await handleCreateProfile(formData);
      }

      // Success - call onSave callback
      onSave?.();
    } catch (error) {
      console.error('Profile save failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const isUpdating = isUpdatingProfile || isCreatingProfile;

  return (
    <div className={`flex flex-1 flex-col ${className || ''}`}>
      <ProfileForm
        mode={mode}
        initialData={formInitialData}
        onSubmit={handleSubmit}
        onCancel={onCancel ? handleCancel : undefined}
        isLoading={isUpdating}
        showAvatarUrlField={showAvatarUrlField}
        showCancel={false}
      />
    </div>
  );
};