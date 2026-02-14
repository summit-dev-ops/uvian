'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, X } from 'lucide-react';

import {
  Button,
  Textarea,
} from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@org/ui';
import type { ProfileDraft } from '~/lib/domains/profile/types';

// Profile schema with Zod validation
const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less'),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  publicFields: z.record(z.string(), z.any()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export interface ProfileFormProps {
  // Mode and initial data
  mode: 'create' | 'edit';
  initialData?: Partial<ProfileDraft>;

  // Required callbacks
  onSubmit: (data: ProfileFormData) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  showAvatarUrlField?: boolean;
  showCancel?: boolean;
  className?: string;
}

/**
 * ProfileForm - Pure form component for creating/editing user profiles
 * Reusable across modals, pages, and inline editing contexts
 * Supports both creation and edit modes with unified validation
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showAvatarUrlField = true,
  showCancel = true,
  className,
}) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialData?.displayName || '',
      avatarUrl: initialData?.avatarUrl || '',
      bio: initialData?.bio || '',
      publicFields: initialData?.publicFields || {},
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, formState } = form;
  const { isDirty, isValid } = formState;

  React.useEffect(() => {
    if (initialData) {
      reset({
        displayName: initialData.displayName || '',
        avatarUrl: initialData.avatarUrl || '',
        bio: initialData.bio || '',
        publicFields: initialData.publicFields || {},
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit profile form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  const watchedValues = watch();
  const bioLength = (watchedValues.bio || '').length;

  return (
    <form
      id="profile-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        {/* Display Name */}
        <Controller
          name="displayName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-displayName">
                Display Name *
              </FieldLabel>
              <Input
                {...field}
                id="profile-displayName"
                placeholder="Enter your display name"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Your display name is how others will see you
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {/* Avatar URL */}
        {showAvatarUrlField && (
          <Controller
            name="avatarUrl"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="profile-avatarUrl">
                  Avatar URL
                </FieldLabel>
                <Input
                  {...field}
                  id="profile-avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Optional: Provide a URL to your avatar image
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        {/* Bio */}
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                {...field}
                id="profile-bio"
                placeholder="Tell others about yourself..."
                rows={4}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              <div className="flex justify-between items-center">
                <FieldDescription>
                  Optional: Share a bit about yourself
                </FieldDescription>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {bioLength}/500
                </span>
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>
      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3">
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          form="profile-form"
          disabled={isLoading || !isDirty || !isValid}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <User className="h-4 w-4 mr-2" />
          )}
          {mode === 'create'
            ? isLoading
              ? 'Creating...'
              : 'Create Profile'
            : isLoading
              ? 'Updating...'
              : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
};
