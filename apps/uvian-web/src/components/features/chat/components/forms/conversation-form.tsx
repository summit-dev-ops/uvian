'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare } from 'lucide-react';

import { Button } from '@org/ui';
import { Input } from '@org/ui';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@org/ui';

// Validation schema for conversation form
const conversationSchema = z.object({
  title: z
    .string()
    .min(1, 'Conversation title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
});

type ConversationFormData = z.infer<typeof conversationSchema>;

export interface ConversationFormProps {
  // Optional initial data (for future edit mode)
  initialData?: {
    title: string;
  };

  // Required callbacks
  onSubmit: (data: ConversationFormData) => void | Promise<void>;
  onCancel?: () => void;

  // Optional props
  isLoading?: boolean;
  showCancel?: boolean;
  className?: string;
  autoFocus?: boolean;
}

/**
 * ConversationForm - Pure form component for creating/editing conversations
 * Reusable across modals, pages, and inline editing contexts
 */
export const ConversationForm: React.FC<ConversationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  showCancel = true,
  className,
  autoFocus = true,
}) => {
  const form = useForm<ConversationFormData>({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      title: initialData?.title || '',
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset, watch, formState } = form;
  const { isDirty, isValid } = formState;

  React.useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ConversationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit conversation form:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  const watchedTitle = watch('title') || '';
  const titleLength = watchedTitle.length;

  return (
    <form
      id="conversation-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className || ''}`}
    >
      <FieldGroup>
        {/* Conversation Title */}
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="conversation-title">
                Conversation Title *
              </FieldLabel>
              <Input
                {...field}
                id="conversation-title"
                placeholder="Enter conversation title..."
                autoFocus={autoFocus}
                disabled={isLoading}
                aria-invalid={fieldState.invalid}
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {titleLength}/100 characters
                </span>
              </div>
              <FieldDescription>
                Choose a descriptive title for your conversation
              </FieldDescription>
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
          form="conversation-form"
          disabled={isLoading || !isDirty || !isValid}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-transparent border-current/40 mr-2" />
          ) : (
            <MessageSquare className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Creating...' : 'Create Conversation'}
        </Button>
      </div>
    </form>
  );
};
