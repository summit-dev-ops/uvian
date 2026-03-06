'use client';

import { X, File, AtSign, Link as LinkIcon } from 'lucide-react';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import { formatFileSize } from '~/lib/domains/shared/attachments/utils';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove?: (index: number) => void;
}

export function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-sm"
        >
          {attachment.type === 'file' && <File className="h-3 w-3" />}
          {attachment.type === 'mention' && <AtSign className="h-3 w-3" />}
          {attachment.type === 'link' && <LinkIcon className="h-3 w-3" />}

          <span className="truncate max-w-[150px]">
            {attachment.type === 'file'
              ? attachment.filename || 'File'
              : attachment.type === 'mention'
              ? attachment.label
              : attachment.type === 'link'
              ? attachment.url
              : 'Attachment'}
            {attachment.type === 'file' && attachment.size && (
              <span className="text-muted-foreground ml-1">
                ({formatFileSize(attachment.size)})
              </span>
            )}
          </span>

          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
