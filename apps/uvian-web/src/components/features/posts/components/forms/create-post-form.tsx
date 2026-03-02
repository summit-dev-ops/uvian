'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paperclip } from 'lucide-react';

import { Button } from '@org/ui';
import { Textarea } from '@org/ui';
import { Field, FieldError, FieldGroup, FieldLabel } from '@org/ui';
import { AssetPickerDialog, AssetPreview } from '~/components/features/assets';
import type { AssetUI } from '~/lib/domains/assets';

const postSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content must be 2000 characters or less')
    .trim(),
});

type PostFormData = z.infer<typeof postSchema>;

export interface CreatePostFormProps {
  onSubmit: (
    data: PostFormData & { attachments?: AssetUI[] }
  ) => void | Promise<void>;
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
  const [showAssetPicker, setShowAssetPicker] = React.useState(false);
  const [attachments, setAttachments] = React.useState<AssetUI[]>([]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
    },
  });

  const handleSubmit = (data: PostFormData) => {
    onSubmit({ ...data, attachments });
  };

  const handleAssetSelect = (asset: AssetUI) => {
    setAttachments((prev) => [...prev, asset]);
    setShowAssetPicker(false);
  };

  const handleRemoveAttachment = (assetId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== assetId));
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
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

      {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {attachments.map((asset) => (
            <AssetPreview
              key={asset.id}
              asset={asset}
              onRemove={() => handleRemoveAttachment(asset.id)}
            />
          ))}
        </div>
      )}

      <FieldGroup className="justify-between gap-2 mt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAssetPicker(true)}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Attach
        </Button>

        <div className="flex gap-2">
          {showCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </FieldGroup>

      <AssetPickerDialog
        open={showAssetPicker}
        onOpenChange={setShowAssetPicker}
        onSelect={handleAssetSelect}
      />
    </form>
  );
};
