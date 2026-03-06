'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@org/ui';
import { Field, FieldLabel, FieldError } from '@org/ui';
import { RichTextArea } from '~/components/shared/ui/rich-input';

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string().optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;

export interface NoteFormProps {
  onSubmit: (data: NoteFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  showCancel?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const NoteForm: React.FC<NoteFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
  showCancel = true,
  className,
  autoFocus = true,
}) => {
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      body: '',
    },
  });

  const handleSubmit = async (data: NoteFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit note:', error);
    }
    form.reset();
  };

  const handleCancel = () => {
    if (!isLoading && onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
      <Field>
        <FieldLabel>Note Title</FieldLabel>
        <input
          {...form.register('title')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Enter note title..."
          disabled={disabled || isLoading}
          autoFocus={autoFocus}
        />
        {form.formState.errors.title && (
          <FieldError>{form.formState.errors.title.message}</FieldError>
        )}
      </Field>

      <Field className="mt-4">
        <FieldLabel>Note Content</FieldLabel>
        <RichTextArea
          value={form.watch('body') || ''}
          onChange={(value) => form.setValue('body', value)}
          placeholder="Write your note..."
          toolbar={true}
          className="min-h-[150px]"
          disabled={disabled || isLoading}
        />
      </Field>

      <div className="flex gap-2 justify-end mt-4">
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={disabled || isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={disabled || isLoading}>
          {isLoading ? 'Creating...' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
};
