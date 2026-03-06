'use client';

import { File, Download } from 'lucide-react';
import type { FileAttachment } from '~/lib/domains/shared/attachments/types';
import { formatFileSize } from '~/lib/domains/shared/attachments/utils';
import { AttachmentChip } from './attachment-chip';

interface FileChipProps {
  file: FileAttachment;
  variant?: 'default' | 'compact';
  onRemove?: () => void;
  onClick?: () => void;
}

function isImageFile(attachment: FileAttachment): boolean {
  return !!attachment.mimeType?.startsWith('image/');
}

export function FileChip({
  file,
  variant = 'default',
  onRemove,
  onClick,
}: FileChipProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isImageFile(file)) {
    return null;
  }

  const content = (
    <>
      <File className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />
      <span className="truncate max-w-[150px]">{file.filename || 'File'}</span>
      {file.size && variant !== 'compact' && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
      )}
      {onRemove && (
        <Download
          className={variant === 'compact' ? 'h-2 w-2' : 'h-3 w-3'}
          onClick={handleDownload}
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left">
        <AttachmentChip variant={variant} onRemove={onRemove}>
          {content}
        </AttachmentChip>
      </button>
    );
  }

  return (
    <AttachmentChip variant={variant} onRemove={onRemove}>
      {content}
    </AttachmentChip>
  );
}
