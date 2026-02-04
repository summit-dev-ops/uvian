'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/use-profile';
import { useProfileEdit } from '../hooks/use-profile-edit';
import { ProfileAvatar } from './ProfileAvatar';
import { Button, Card, Input, Textarea } from '@org/ui';
import { Save, X, AlertCircle, Camera, User, ArrowLeft } from 'lucide-react';
import { cn } from '@org/ui';
import type { ProfileDraft } from '~/lib/domains/user/types';

/**
 * Props for the ProfileEditor component
 */
interface ProfileEditorProps {
  onSave?: () => void;
  onCancel?: () => void;
  initialData?: Partial<ProfileDraft>;
  showAvatarUrlField?: boolean;
  className?: string;
}

/**
 * ProfileEditor component for editing profile information
 * Provides a comprehensive form interface with validation
 */
export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  onSave,
  onCancel,
  initialData,
  showAvatarUrlField = true,
  className,
}) => {
  const {
    handleUpdateProfile,
    handleCreateProfile,
    isUpdatingProfile,
    isCreatingProfile,
    hasProfile,
  } = useProfile();

  const { stopEditingProfile, validateProfileDraft } = useProfileEdit();

  // Form state
  const [formData, setFormData] = useState<ProfileDraft>({
    displayName: initialData?.displayName || '',
    avatarUrl: initialData?.avatarUrl || null,
    bio: initialData?.bio || null,
    publicFields: initialData?.publicFields || {},
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName || '',
        avatarUrl: initialData.avatarUrl || '',
        bio: initialData.bio || '',
        publicFields: initialData.publicFields || {},
      });
    }
  }, [initialData]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate form data
      const errors = validateProfileDraft(formData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setIsSubmitting(false);
        return;
      }

      // Determine if we're creating or updating
      const isCreating = !hasProfile;

      if (isCreating) {
        await handleCreateProfile(formData);
      } else {
        await handleUpdateProfile(formData);
      }

      // Success - call onSave callback
      onSave?.();
    } catch (error) {
      console.error('Profile update/create failed:', error);
      setValidationErrors(['Failed to save profile. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof ProfileDraft, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      displayName: '',
      avatarUrl: '',
      bio: '',
      publicFields: {},
    });
    setValidationErrors([]);
    stopEditingProfile();
    onCancel?.();
  };

  // Loading state
  if (isUpdatingProfile || isCreatingProfile) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border border-primary/30 border-t-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {hasProfile ? 'Updating profile...' : 'Creating profile...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = formData.displayName || 'User';
  const isValidForm =
    formData.displayName.trim().length > 0 && validationErrors.length === 0;
  const canSubmit = isValidForm && !isSubmitting;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {hasProfile ? 'Edit Profile' : 'Create Profile'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasProfile
              ? 'Update your profile information'
              : 'Complete your profile to get started'}
          </p>
        </div>
        {onCancel && (
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive">
                Please fix the following errors:
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-destructive">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-destructive">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Preview */}
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <ProfileAvatar
                avatarUrl={formData.avatarUrl}
                displayName={displayName}
                size="lg"
                showBorder={true}
                borderColor="border-primary/20"
              />
              {showAvatarUrlField && (
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">{displayName}</h3>
              <p className="text-sm text-muted-foreground">
                This is how others will see you
              </p>
            </div>
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Display Name */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display Name *
                </label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  value={formData.displayName || ''}
                  onChange={(e) =>
                    handleInputChange('displayName', e.target.value)
                  }
                  className={cn(
                    !formData.displayName?.trim() &&
                      'border-destructive focus:border-destructive'
                  )}
                />
                {!formData.displayName.trim() && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Display name is required</span>
                  </p>
                )}
              </div>

              {/* Avatar URL */}
              {showAvatarUrlField && (
                <div className="space-y-2">
                  <label htmlFor="avatarUrl" className="text-sm font-medium">
                    Avatar URL
                  </label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl || ''}
                    onChange={(e) =>
                      handleInputChange('avatarUrl', e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Provide a URL to your avatar image
                  </p>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <Textarea
                id="bio"
                placeholder="Tell others about yourself..."
                rows={4}
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Optional: Share a bit about yourself
                </p>
                <span className="text-xs text-muted-foreground">
                  {(formData.bio || '').length}/500
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit} className="min-w-24">
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasProfile ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * Simplified editor for inline editing
 */
export const InlineProfileEditor: React.FC<{
  initialData?: Partial<ProfileDraft>;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}> = ({ initialData, onSave, onCancel, className }) => {
  return (
    <ProfileEditor
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      showAvatarUrlField={false}
      className={className}
    />
  );
};
