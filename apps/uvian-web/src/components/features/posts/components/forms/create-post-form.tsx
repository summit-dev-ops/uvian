'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@org/ui';
import { Textarea } from '@org/ui';
import { Field, FieldError, FieldGroup, FieldLabel } from '@org/ui';

const postSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content must be 2000 characters or less')
    .trim(),
});

type PostFormData = z.infer<typeof postSchema>;

export interface CreatePostFormProps {
  onSubmit: (data: PostFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showCancel?: boolean;
  className?: string;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  showCancel = true,
  className,
}) => {
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
      <Field>
        <FieldLabel>Content</FieldLabel>
        <Controller
          name="content"
          control={form.control}
          render={({ field }) => (
            <>
              <Textarea
                {...field}
                placeholder="What's on your mind?"
                rows={4}
                disabled={isLoading}
              />
              {form.formState.errors.content && (
                <FieldError>{form.formState.errors.content.message}</FieldError>
              )}
            </>
          )}
        />
      </Field>

      <FieldGroup className="justify-end gap-2 mt-4">
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Posting...' : 'Post'}
        </Button>
      </FieldGroup>
    </form>
  );
};
