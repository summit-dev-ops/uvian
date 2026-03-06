'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@org/ui';
import { CreatePostForm, type ContentItem } from '../forms/create-post-form';
import type { PostContentPayload } from '~/lib/domains/posts/api/mutations';

type PostFormSubmitData = {
  contents: PostContentPayload[];
};

export interface CreatePostDialogProps {
  spaceId: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: PostFormSubmitData) => Promise<void>;
  submitPending?: boolean;
  submitError?: Error | null;
  onCancel?: (data: unknown) => Promise<void>;
}

function transformToPostContentPayload(
  items: ContentItem[]
): PostContentPayload[] {
  return items.map((item) => {
    if (item.type === 'note') {
      return {
        type: 'note' as const,
        noteId: item.id,
        note: {
          title: item.title || 'Untitled',
          body: item.body || '',
          attachments: (item.attachments || []) as never,
        },
      };
    }
    if (item.type === 'asset') {
      return {
        type: 'asset' as const,
        assetId: item.assetId,
        asset: item.asset
          ? {
              filename: item.asset.filename || 'File',
              mimeType: item.asset.mimeType || undefined,
              url: item.asset.url || undefined,
            }
          : undefined,
      };
    }
    return {
      type: 'external' as const,
      url: item.url,
    };
  });
}

export function CreatePostDialog({
  spaceId,
  children,
  open,
  onOpenChange,
  onSubmit,
  submitPending,
  submitError,
  onCancel,
}: CreatePostDialogProps) {
  const handleSubmit = async (data: { contents: ContentItem[] }) => {
    try {
      const transformedContents = transformToPostContentPayload(data.contents);
      await onSubmit({ contents: transformedContents });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
    onOpenChange?.(false);
  };

  const handleCancel = async () => {
    if (!submitPending) {
      try {
        if (onCancel) {
          await onCancel({});
        }
        onOpenChange?.(false);
      } catch (error) {
        console.error('Failed to cancel post creation:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Create Post
          </DialogTitle>
          <DialogDescription>
            Share something with your space members.
          </DialogDescription>
        </DialogHeader>
        <CreatePostForm
          spaceId={spaceId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitPending}
          showCancel={true}
        />
      </DialogContent>
    </Dialog>
  );
}
