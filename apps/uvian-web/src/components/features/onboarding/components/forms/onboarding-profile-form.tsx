'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Loader2 } from 'lucide-react';

import { Button, Textarea, Input } from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui';

// Enhanced schema with better validation for onboarding
const onboardingProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      'Display name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    ),
  type: z.enum(['human', 'agent', 'system'], {
    message: 'Please select a profile type',
  }),
  bio: z
    .string()
    .max(300, 'Bio must be 300 characters or less')
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  coverUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type OnboardingFormData = z.infer<typeof onboardingProfileSchema>;

export interface OnboardingProfileFormProps {
  // Required callbacks
  onSubmit: (data: OnboardingFormData) => void | Promise<void>;

  // Optional props
  isLoading?: boolean;
  initialData?: Partial<OnboardingFormData>;
  className?: string;
}

/**
 * OnboardingProfileForm - Simplified profile creation form for onboarding
 *
 * Based on the existing profile form but optimized for new users.
 * Focuses on essential information and provides better UX for first-time setup.
 */
export const OnboardingProfileForm: React.FC<OnboardingProfileFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  className,
}) => {
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      displayName: initialData?.displayName || '',
      type: initialData?.type || 'human',
      bio: initialData?.bio || '',
      avatarUrl: initialData?.avatarUrl || '',
      coverUrl: initialData?.coverUrl || '',
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, formState } = form;
  const { isDirty, isValid } = formState;

  const watchedValues = watch();
  const bioLength = (watchedValues.bio || '').length;
  const avatarLength = (watchedValues.avatarUrl || '').length;
  const coverLength = (watchedValues.coverUrl || '').length;

  React.useEffect(() => {
    if (initialData) {
      reset({
        displayName: initialData.displayName || '',
        type: initialData.type || 'human',
        bio: initialData.bio || '',
        avatarUrl: initialData.avatarUrl || '',
        coverUrl: initialData.coverUrl || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: OnboardingFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit onboarding profile form:', error);
    }
  };

  return (
    <form
      id="onboarding-profile-form"
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
              <FieldLabel htmlFor="onboarding-displayName">
                Display Name *
              </FieldLabel>
              <Input
                {...field}
                id="onboarding-displayName"
                placeholder="Enter your display name"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
                autoComplete="name"
              />
              <FieldDescription>
                This is how others will see you. You can change this later.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Profile Type */}
        <Controller
          name="type"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-type">Profile Type *</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger id="onboarding-type">
                  <SelectValue placeholder="Choose your profile type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Choose the type that best describes your identity
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Bio */}
        <Controller
          name="bio"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-bio">Bio</FieldLabel>
              <Textarea
                {...field}
                id="onboarding-bio"
                placeholder="Tell others about yourself (optional)..."
                rows={3}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
                autoComplete="organization"
              />
              <div className="flex justify-between items-center">
                <FieldDescription>
                  Optional: Share something about yourself
                </FieldDescription>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {bioLength}/300
                </span>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Avatar URL */}
        <Controller
          name="avatarUrl"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-avatarUrl">Avatar URL</FieldLabel>
              <Input
                {...field}
                id="onboarding-avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
                autoComplete="url"
              />
              <div className="flex justify-between items-center">
                <FieldDescription>
                  Optional: Link to your profile picture
                </FieldDescription>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {avatarLength > 0 ? `${avatarLength} chars` : 'Optional'}
                </span>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Cover URL */}
        <Controller
          name="coverUrl"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="onboarding-coverUrl">
                Cover Image URL
              </FieldLabel>
              <Input
                {...field}
                id="onboarding-coverUrl"
                placeholder="https://example.com/cover.jpg"
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
                autoComplete="url"
              />
              <div className="flex justify-between items-center">
                <FieldDescription>
                  Optional: Link to your cover image
                </FieldDescription>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {coverLength > 0 ? `${coverLength} chars` : 'Optional'}
                </span>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">* Required fields</div>
        <Button
          type="submit"
          form="onboarding-profile-form"
          disabled={isLoading || !isDirty || !isValid}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-2" />
              Create Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
