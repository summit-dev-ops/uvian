'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';

import { Button } from '@org/ui';
import { Input } from '@org/ui';
import { Textarea } from '@org/ui';
import { Checkbox } from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';

// Validation schema for space form (unified for create + edit)
const spaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Space name is required')
    .max(100, 'Space name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean(),
});

type SpaceFormData = z.infer<typeof spaceSchema>;

export interface SpaceFormProps {
  // Mode and initial data
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    description?: string;
    isPrivate: boolean;
  };

  // Required callbacks
  onSubmit: (data: SpaceFormData) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  disabled?: boolean;
  showCancel?: boolean;
  className?: string;
  autoFocus?: boolean;
}

/**
 * SpaceForm - Pure form component for creating/editing spaces
 * Reusable across modals, pages, and inline editing contexts
 * Supports both creation and edit modes with unified validation
 */
export const SpaceForm: React.FC<SpaceFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
  showCancel = true,
  className,
  autoFocus = true,
}) => {
  const form = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      isPrivate: initialData?.isPrivate || false,
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, formState } = form;
  const { isDirty, isValid } = formState;

  React.useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        isPrivate: initialData.isPrivate || false,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: SpaceFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit space form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  const watchedName = watch('name') || '';
  const watchedDescription = watch('description') || '';

  const nameLength = watchedName.length;
  const descriptionLength = watchedDescription.length;

  return (
    <form
      id="space-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="space-name">Space Name *</FieldLabel>
              <Input
                {...field}
                id="space-name"
                placeholder="Enter space name..."
                autoFocus={autoFocus}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              <div className="flex justify-between items-center">
                <FieldDescription>
                  Choose a descriptive name for your space
                </FieldDescription>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {nameLength}/100 characters
                </span>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Description */}
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="space-description">Description</FieldLabel>
              <Textarea
                {...field}
                id="space-description"
                placeholder="Enter space description (optional)..."
                disabled={isLoading || disabled}
                rows={3}
                aria-invalid={fieldState.invalid}
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {descriptionLength}/500 characters
                </span>
              </div>
              <FieldDescription>
                Optional: Provide details about what this space is for
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Privacy Setting */}
        <Controller
          name="isPrivate"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="space-isPrivate"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || disabled}
                  aria-invalid={fieldState.invalid}
                />
                <div className="flex-1">
                  <FieldLabel
                    htmlFor="space-isPrivate"
                    className="cursor-pointer"
                  >
                    Make this space private
                  </FieldLabel>
                  <FieldDescription>
                    Private spaces are only visible to invited members
                  </FieldDescription>
                </div>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

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
        <Button
          type="submit"
          form="space-form"
          disabled={isLoading || disabled || !isDirty || !isValid}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <Building2 className="h-4 w-4 mr-2" />
          )}
          {mode === 'create'
            ? isLoading
              ? 'Creating...'
              : 'Create Space'
            : isLoading
            ? 'Saving...'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
