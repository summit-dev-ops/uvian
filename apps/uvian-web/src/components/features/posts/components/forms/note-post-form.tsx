'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@org/ui';
import { Field, FieldError, FieldLabel } from '@org/ui';
import { AssetPickerDialog } from '~/components/features/assets';
import { AssetPreview } from '~/components/features/assets';
import { RichTextArea } from '~/components/shared/ui/rich-input';
import type { AssetUI } from '~/lib/domains/assets';
import { assetToAttachment } from '~/lib/domains/shared/attachments/utils';

const noteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string().optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;

export interface NotePostFormProps {
  initialValues?: {
    title?: string;
    body?: string;
    attachments?: AssetUI[];
  };
  onChange?: (data: {
    title: string;
    body?: string;
    attachments: ReturnType<typeof assetToAttachment>[];
  }) => void;
  disabled?: boolean;
  showAttachments?: boolean;
}

export function NotePostForm({
  initialValues,
  onChange,
  disabled = false,
  showAttachments = true,
}: NotePostFormProps) {
  const [showAssetPicker, setShowAssetPicker] = React.useState(false);
  const [attachments, setAttachments] = React.useState<AssetUI[]>(
    initialValues?.attachments || []
  );

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: initialValues?.title || '',
      body: initialValues?.body || '',
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onChange?.({
        title: values.title || '',
        body: values.body,
        attachments: attachments.map(assetToAttachment),
      });
    });
    return () => subscription.unsubscribe();
  }, [form, attachments, onChange]);

  const handleAssetSelect = (asset: AssetUI) => {
    const newAttachments = [...attachments, asset];
    setAttachments(newAttachments);
    onChange?.({
      title: form.getValues('title') || '',
      body: form.getValues('body'),
      attachments: newAttachments.map(assetToAttachment),
    });
    setShowAssetPicker(false);
  };

  const handleRemoveAttachment = (assetId: string) => {
    const newAttachments = attachments.filter((a) => a.id !== assetId);
    setAttachments(newAttachments);
    onChange?.({
      title: form.getValues('title') || '',
      body: form.getValues('body'),
      attachments: newAttachments.map(assetToAttachment),
    });
  };

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Note Title</FieldLabel>
        <Controller
          name="title"
          control={form.control}
          render={({ field }) => (
            <>
              <input
                {...field}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter note title..."
                disabled={disabled}
              />
              {form.formState.errors.title && (
                <FieldError>{form.formState.errors.title.message}</FieldError>
              )}
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>Note Content</FieldLabel>
        <Controller
          name="body"
          control={form.control}
          render={({ field }) => (
            <RichTextArea
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Write your note..."
              toolbar={true}
              className="min-h-[150px]"
              disabled={disabled}
            />
          )}
        />
      </Field>

      {showAttachments && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAssetPicker(true)}
            disabled={disabled}
          >
            Attach Files
          </Button>

          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((asset) => (
                <AssetPreview
                  key={asset.id}
                  asset={asset}
                  onRemove={() => handleRemoveAttachment(asset.id)}
                />
              ))}
            </div>
          )}

          <AssetPickerDialog
            open={showAssetPicker}
            onOpenChange={setShowAssetPicker}
            onSelect={handleAssetSelect}
          />
        </>
      )}
    </div>
  );
}
