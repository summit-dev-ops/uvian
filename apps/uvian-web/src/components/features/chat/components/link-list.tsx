'use client';

import { Link as LinkIcon, File, Download } from 'lucide-react';
import { Button } from '@org/ui';
import type { LinkAttachment, FileAttachment } from '~/lib/domains/chat/types';

interface LinkListProps {
  links: LinkAttachment[];
  files: FileAttachment[];
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(attachment: FileAttachment): boolean {
  return !!attachment.mimeType?.startsWith('image/');
}

export function LinkList({ links, files }: LinkListProps) {
  const nonImageFiles = files.filter((f) => !isImageFile(f));
  const hasItems = links.length > 0 || nonImageFiles.length > 0;

  if (!hasItems) {
    return null;
  }

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {links.map((link, index) => (
        <a
          key={`link-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 border rounded-md hover:bg-accent transition-colors text-sm"
        >
          <LinkIcon className="h-3 w-3 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{link.url}</span>
        </a>
      ))}

      {nonImageFiles.map((file, index) => (
        <div
          key={`file-${index}`}
          className="inline-flex items-center gap-2 px-2 py-1 border rounded-md hover:bg-accent transition-colors"
        >
          <File className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm truncate max-w-[150px]">
              {file.filename || 'File'}
            </span>
            {file.size && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => handleDownload(file)}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
