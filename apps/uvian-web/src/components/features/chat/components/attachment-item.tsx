'use client';

import { useState } from 'react';
import {
  AtSign,
  Paperclip,
  Link as LinkIcon,
  File,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@org/ui';
import { ImageLightbox } from './image-lightbox';
import type { Attachment } from '~/lib/domains/chat/types';

interface AttachmentItemProps {
  attachment: Attachment;
  onRemove?: () => void;
  showRemove?: boolean;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: Attachment): boolean {
  return (
    attachment.type === 'file' && !!attachment.mimeType?.startsWith('image/')
  );
}

function isPdfAttachment(attachment: Attachment): boolean {
  return (
    attachment.type === 'file' && attachment.mimeType === 'application/pdf'
  );
}

export function AttachmentItem({
  attachment,
  onRemove,
  showRemove = false,
}: AttachmentItemProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (attachment.type === 'mention') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-sm">
        <AtSign className="h-3 w-3" />
        <span>{attachment.label}</span>
        {showRemove && onRemove && (
          <button onClick={onRemove} className="ml-1 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  if (attachment.type === 'link') {
    return (
      <div className="inline-flex items-center gap-2">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 border rounded-md hover:bg-accent transition-colors text-sm"
        >
          <LinkIcon className="h-3 w-3 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{attachment.url}</span>
        </a>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (attachment.type === 'file') {
    if (isImageAttachment(attachment)) {
      return (
        <div className="relative inline-block group">
          <button
            onClick={() => setLightboxOpen(true)}
            className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
          >
            <img
              src={attachment.url}
              alt={attachment.filename || 'Image'}
              className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </button>
          {attachment.filename && (
            <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
              {attachment.filename}
            </div>
          )}
          {showRemove && onRemove && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ImageLightbox
            src={attachment.url}
            alt={attachment.filename || 'Image'}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        </div>
      );
    }

    const handleDownload = () => {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.filename || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="inline-flex items-center gap-2 p-2 border rounded-lg hover:bg-accent transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {isPdfAttachment(attachment) ? (
            <File className="h-4 w-4 text-red-500 shrink-0" />
          ) : (
            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm truncate max-w-[150px]">
              {attachment.filename || 'File'}
            </span>
            {attachment.size && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return null;
}
