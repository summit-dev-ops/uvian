'use client';

import React from 'react';
import { ProfileForm } from './forms/profile-form';
import { useProfile } from '../hooks/use-profile';
import type { ProfileDraft } from '~/lib/domains/user/types';

// Optimized prop interface
interface ProfileEditorProps {
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
  onSave,
  onCancel,
  initialData,
  showAvatarUrlField = true,
  className,
}) => {
  const {
    profile,
    hasProfile,
    handleUpdateProfile,
    handleCreateProfile,
    isUpdatingProfile,
    isCreatingProfile,
  } = useProfile();

  // Determine mode based on existing profile
  const mode = hasProfile ? 'edit' : 'create';

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
      if (hasProfile) {
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