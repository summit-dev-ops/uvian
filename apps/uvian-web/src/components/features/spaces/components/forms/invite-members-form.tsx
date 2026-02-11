'use client';

import * as React from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Plus, X } from 'lucide-react';

import { Button } from '@org/ui';
import { Input } from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';

// Validation schema for individual invite
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim(),
  role: z.enum(['admin', 'member']),
});

// Validation schema for the form
const inviteMembersSchema = z.object({
  invites: z.array(inviteSchema).min(1, 'At least one invitation is required'),
  bulkEmails: z.string().optional(),
});

export type InviteMemberData = z.infer<typeof inviteSchema>;
export type InviteMembersFormData = z.infer<typeof inviteMembersSchema>;

export interface InviteMembersFormProps {
  initialData?: {
    invites?: InviteMemberData[];
    bulkEmails?: string;
  };

  onSubmit: (data: InviteMembersFormData) => void | Promise<void>;
  onCancel?: () => void;

  isLoading?: boolean;
  defaultRole?: 'admin' | 'member';
  showCancel?: boolean;
  className?: string;
}

/**
 * InviteMembersForm - Pure form component for inviting members to the app
 * Supports both individual invitations and bulk email import
 * Reusable across modals, pages, and inline editing contexts
 */
export const InviteMembersForm: React.FC<InviteMembersFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultRole = 'member',
  showCancel = true,
  className,
}) => {
  const form = useForm<InviteMembersFormData>({
    resolver: zodResolver(inviteMembersSchema),
    defaultValues: {
      invites: initialData?.invites || [{ email: '', role: defaultRole }],
      bulkEmails: initialData?.bulkEmails || '',
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invites',
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        invites: initialData.invites || [{ email: '', role: defaultRole }],
        bulkEmails: initialData.bulkEmails || '',
      });
    }
  }, [initialData, defaultRole, reset]);

  const addInvite = () => {
    append({ email: '', role: defaultRole });
  };

  const handleBulkImport = () => {
    const bulkEmailsValue = watch('bulkEmails') || '';
    const emails = bulkEmailsValue
      .split(/[,\n\s]+/)
      .map((email) => email.trim())
      .filter((email) => email && z.string().email().safeParse(email).success);

    if (emails.length === 0) return;

    emails.forEach((email) => {
      append({ email, role: defaultRole });
    });
    reset({ ...form.getValues(), bulkEmails: '' });
  };

  const handleFormSubmit = async (data: InviteMembersFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit invite members form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  const watchedInvites = watch('invites') || [];
  const watchedBulkEmails = watch('bulkEmails') || '';

  return (
    <form
      id="invite-members-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        {/* Bulk Import Section */}
        <Controller
          name="bulkEmails"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Bulk Import</FieldLabel>
              <div className="flex gap-2">
                <Input
                  {...field}
                  placeholder="Enter email addresses separated by commas or new lines..."
                  disabled={isLoading}
                  aria-invalid={fieldState.invalid}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBulkImport}
                  disabled={!watchedBulkEmails.trim() || isLoading}
                >
                  Add
                </Button>
              </div>
              <FieldDescription>
                Import multiple email addresses at once
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Individual Invitations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Individual Invitations</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInvite}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another
          </Button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Controller
                  name={`invites.${index}.email`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Input
                        {...field}
                        type="email"
                        placeholder="email@example.com"
                        disabled={isLoading}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="w-32">
                <Controller
                  name={`invites.${index}.role`}
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-xs text-muted-foreground">
        <div>
          <strong>Member:</strong> Can participate in conversations but cannot
          manage space settings
        </div>
        <div>
          <strong>Admin:</strong> Can manage space settings, members, and all
          conversations
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" form="invite-members-form" disabled={isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          {isLoading
            ? 'Sending...'
            : `Send Invitations (${
                watchedInvites.filter((invite) => invite?.email?.trim()).length
              })`}
        </Button>
      </div>
    </form>
  );
};
