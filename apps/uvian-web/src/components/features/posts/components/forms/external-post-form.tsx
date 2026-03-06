'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, FieldError, FieldLabel } from '@org/ui';

const externalSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

export type ExternalFormData = z.infer<typeof externalSchema>;

export interface ExternalPostFormProps {
  initialValues?: {
    url?: string;
  };
  onChange?: (data: { url: string }) => void;
  disabled?: boolean;
}

export function ExternalPostForm({
  initialValues,
  onChange,
  disabled = false,
}: ExternalPostFormProps) {
  const form = useForm<ExternalFormData>({
    resolver: zodResolver(externalSchema),
    defaultValues: {
      url: initialValues?.url || '',
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.url && !form.formState.errors.url) {
        onChange?.({ url: values.url });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Field>
      <FieldLabel>URL</FieldLabel>
      <Controller
        name="url"
        control={form.control}
        render={({ field }) => (
          <>
            <input
              {...field}
              type="url"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="https://example.com"
              disabled={disabled}
            />
            {form.formState.errors.url && (
              <FieldError>{form.formState.errors.url.message}</FieldError>
            )}
          </>
        )}
      />
    </Field>
  );
}
