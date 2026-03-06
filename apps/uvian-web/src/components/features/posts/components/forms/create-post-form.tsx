'use client';

import * as React from 'react';
import { FileText, Link as LinkIcon, Image, X, Plus } from 'lucide-react';
import { Button } from '@org/ui';
import { FieldGroup } from '@org/ui';
import { NotePostForm } from './note-post-form';
import { AssetPostForm } from './asset-post-form';
import { ExternalPostForm } from './external-post-form';
import type { AssetUI } from '~/lib/domains/assets';
import { assetToAttachment } from '~/lib/domains/shared/attachments/utils';

export type ContentItemType = 'note' | 'asset' | 'external';

export interface ContentItem {
  id: string;
  type: ContentItemType;
  title?: string;
  body?: string;
  attachments?: AssetUI[];
  assetId?: string;
  asset?: AssetUI;
  url?: string;
}

export interface CreatePostFormProps {
  spaceId: string;
  onSubmit: (data: { contents: ContentItem[] }) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showCancel?: boolean;
  className?: string;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  spaceId,
  onSubmit,
  onCancel,
  isLoading = false,
  showCancel = true,
  className,
}) => {
  const [contentItems, setContentItems] = React.useState<ContentItem[]>([]);

  const addNote = () => {
    setContentItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'note',
        title: '',
        body: '',
        attachments: [],
      },
    ]);
  };

  const addAsset = () => {
    setContentItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'asset',
        assetId: '',
        asset: undefined,
      },
    ]);
  };

  const addExternal = () => {
    setContentItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'external', url: '' },
    ]);
  };

  const removeItem = (id: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateNoteContent = (
    id: string,
    data: {
      title: string;
      body?: string;
      attachments: ReturnType<typeof assetToAttachment>[];
    }
  ) => {
    setContentItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              title: data.title,
              body: data.body,
              attachments: data.attachments.map((a) => a as unknown as AssetUI),
            }
          : item
      )
    );
  };

  const updateAssetContent = (
    id: string,
    data: { assetId: string; asset: AssetUI }
  ) => {
    setContentItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              assetId: data.assetId,
              asset: data.asset,
            }
          : item
      )
    );
  };

  const updateExternalContent = (id: string, data: { url: string }) => {
    setContentItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, url: data.url } : item))
    );
  };

  const handleSubmit = () => {
    onSubmit({ contents: contentItems });
  };

  return (
    <div className={className}>
      <div className="flex gap-2 mb-4">
        <Button type="button" variant="outline" size="sm" onClick={addNote}>
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addAsset}>
          <Plus className="h-4 w-4 mr-1" />
          Add File
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addExternal}>
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      </div>

      {contentItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Add content to your post using the buttons above
        </div>
      ) : (
        <div className="space-y-4">
          {contentItems.map((item) => (
            <ContentItemCard
              key={item.id}
              item={item}
              onNoteChange={(data) => updateNoteContent(item.id, data)}
              onAssetChange={(data) => updateAssetContent(item.id, data)}
              onExternalChange={(data) => updateExternalContent(item.id, data)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      )}

      <FieldGroup className="justify-end gap-2 mt-6">
        <div className="flex gap-2">
          {showCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || contentItems.length === 0}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </FieldGroup>
    </div>
  );
};

interface ContentItemCardProps {
  item: ContentItem;
  onNoteChange: (data: {
    title: string;
    body?: string;
    attachments: ReturnType<typeof assetToAttachment>[];
  }) => void;
  onAssetChange: (data: { assetId: string; asset: AssetUI }) => void;
  onExternalChange: (data: { url: string }) => void;
  onRemove: () => void;
}

function ContentItemCard({
  item,
  onNoteChange,
  onAssetChange,
  onExternalChange,
  onRemove,
}: ContentItemCardProps) {
  if (item.type === 'note') {
    return (
      <div className="p-3 border rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Note</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <NotePostForm
          initialValues={{
            title: item.title,
            body: item.body,
            attachments: item.attachments,
          }}
          onChange={onNoteChange}
          showAttachments={true}
        />
      </div>
    );
  }

  if (item.type === 'asset') {
    return (
      <div className="p-3 border rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="text-sm font-medium">File</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <AssetPostForm
          initialValues={{
            asset: item.asset,
          }}
          onChange={onAssetChange}
        />
      </div>
    );
  }

  if (item.type === 'external') {
    return (
      <div className="p-3 border rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Link</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ExternalPostForm
          initialValues={{
            url: item.url,
          }}
          onChange={onExternalChange}
        />
      </div>
    );
  }

  return null;
}
