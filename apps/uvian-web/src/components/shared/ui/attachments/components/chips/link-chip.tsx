'use client';

import { Link as LinkIcon } from 'lucide-react';
import type { LinkAttachment } from '~/lib/domains/shared/attachments/types';
import { AttachmentChip } from './attachment-chip';

interface LinkChipProps {
  link: LinkAttachment;
  variant?: 'default' | 'compact';
  onRemove?: () => void;
}

function getDisplayUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
}

export function LinkChip({
  link,
  variant = 'default',
  onRemove,
}: LinkChipProps) {
  const handleClick = () => {
    window.open(link.url, '_blank');
  };

  return (
    <button onClick={handleClick} className="text-left">
      <AttachmentChip variant={variant} onRemove={onRemove}>
        <LinkIcon className={variant === 'compact' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span className="truncate max-w-[200px]">
          {getDisplayUrl(link.url)}
        </span>
      </AttachmentChip>
    </button>
  );
}
