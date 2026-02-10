'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Checkbox,
} from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';
import {
  Save,
  X,
} from 'lucide-react';

// Settings schema with Zod validation
const settingsSchema = z.object({
  account: z.object({
    emailNotifications: z.boolean(),
    emailFrequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
  }),
  notifications: z.object({
    pushNotifications: z.boolean(),
    soundEnabled: z.boolean(),
    mentionNotifications: z.boolean(),
    messageNotifications: z.boolean(),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts']),
    allowDirectMessages: z.boolean(),
    readReceipts: z.boolean(),
  }),
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    compactMode: z.boolean(),
    showAvatars: z.boolean(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export interface SettingsFormProps {
  // Optional initial data
  initialData?: {
    account?: {
      emailNotifications?: boolean;
      emailFrequency?: 'immediate' | 'daily' | 'weekly' | 'never';
    };
    notifications?: {
      pushNotifications?: boolean;
      soundEnabled?: boolean;
      mentionNotifications?: boolean;
      messageNotifications?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'contacts';
      allowDirectMessages?: boolean;
      readReceipts?: boolean;
    };
    appearance?: {
      theme?: 'light' | 'dark' | 'auto';
      compactMode?: boolean;
      showAvatars?: boolean;
    };
  };

  // Required callbacks
  onSubmit: (data: SettingsFormData) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  showCancel?: boolean;
  className?: string;
}

/**
 * SettingsForm - Pure form component for editing user settings
 * Edit-only form (settings don't get "created")
 * Reusable across modals, pages, and inline editing contexts
 */
export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showCancel = true,
  className,
}) => {
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      account: {
        emailNotifications: initialData?.account?.emailNotifications ?? true,
        emailFrequency: initialData?.account?.emailFrequency ?? 'immediate',
      },
      notifications: {
        pushNotifications:
          initialData?.notifications?.pushNotifications ?? true,
        soundEnabled: initialData?.notifications?.soundEnabled ?? false,
        mentionNotifications:
          initialData?.notifications?.mentionNotifications ?? true,
        messageNotifications:
          initialData?.notifications?.messageNotifications ?? true,
      },
      privacy: {
        profileVisibility: initialData?.privacy?.profileVisibility ?? 'public',
        allowDirectMessages: initialData?.privacy?.allowDirectMessages ?? true,
        readReceipts: initialData?.privacy?.readReceipts ?? true,
      },
      appearance: {
        theme: initialData?.appearance?.theme ?? 'auto',
        compactMode: initialData?.appearance?.compactMode ?? false,
        showAvatars: initialData?.appearance?.showAvatars ?? true,
      },
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, formState } = form;
  const { isDirty, isValid } = formState;

  React.useEffect(() => {
    if (initialData) {
      reset({
        account: {
          emailNotifications: initialData.account?.emailNotifications ?? true,
          emailFrequency: initialData.account?.emailFrequency ?? 'immediate',
        },
        notifications: {
          pushNotifications:
            initialData.notifications?.pushNotifications ?? true,
          soundEnabled: initialData.notifications?.soundEnabled ?? false,
          mentionNotifications:
            initialData.notifications?.mentionNotifications ?? true,
          messageNotifications:
            initialData.notifications?.messageNotifications ?? true,
        },
        privacy: {
          profileVisibility: initialData.privacy?.profileVisibility ?? 'public',
          allowDirectMessages: initialData.privacy?.allowDirectMessages ?? true,
          readReceipts: initialData.privacy?.readReceipts ?? true,
        },
        appearance: {
          theme: initialData.appearance?.theme ?? 'auto',
          compactMode: initialData.appearance?.compactMode ?? false,
          showAvatars: initialData.appearance?.showAvatars ?? true,
        },
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: SettingsFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit settings form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  return (
    <form id="settings-form" className={`space-y-6 ${className || ''}`} onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup>
        <Controller
          name="account.emailNotifications"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Email Notifications</FieldLabel>
                  <FieldDescription>
                    Receive email notifications for important updates
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="account.emailFrequency"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Email Frequency</FieldLabel>
              <div className="relative">
                <select
                  {...field}
                  disabled={isLoading}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <FieldDescription>
                How often would you like to receive emails?
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="notifications.pushNotifications"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Push Notifications</FieldLabel>
                  <FieldDescription>
                    Receive push notifications in your browser
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="notifications.soundEnabled"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Sound Alerts</FieldLabel>
                  <FieldDescription>
                    Play sounds for notifications
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="notifications.mentionNotifications"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Mention Notifications</FieldLabel>
                  <FieldDescription>
                    Get notified when someone mentions you
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="notifications.messageNotifications"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Message Notifications</FieldLabel>
                  <FieldDescription>
                    Get notified about new messages
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>
      <FieldGroup>
        <Controller
          name="privacy.profileVisibility"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Profile Visibility</FieldLabel>
              <div className="relative">
                <select
                  {...field}
                  disabled={isLoading}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="contacts">Contacts Only</option>
                </select>
              </div>
              <FieldDescription>
                Who can see your profile?
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="privacy.allowDirectMessages"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Allow Direct Messages</FieldLabel>
                  <FieldDescription>
                    Allow anyone to send you direct messages
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="privacy.readReceipts"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Read Receipts</FieldLabel>
                  <FieldDescription>
                    Show when you have read messages
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>
      <FieldGroup>
        <Controller
          name="appearance.theme"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Theme</FieldLabel>
              <div className="relative">
                <select
                  {...field}
                  disabled={isLoading}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">System</option>
                </select>
              </div>
              <FieldDescription>
                Choose your preferred theme
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="appearance.compactMode"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Compact Mode</FieldLabel>
                  <FieldDescription>
                    Use a more compact interface
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="appearance.showAvatars"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <FieldLabel>Show Avatars</FieldLabel>
                  <FieldDescription>
                    Display user avatars throughout the interface
                  </FieldDescription>
                </div>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
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
          form="settings-form"
          disabled={isLoading || !isDirty || !isValid}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
