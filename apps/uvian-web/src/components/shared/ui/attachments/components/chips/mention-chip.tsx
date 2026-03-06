'use client';

import { AtSign } from 'lucide-react';
import type { MentionAttachment } from '~/lib/domains/shared/attachments/types';
import { AttachmentChip } from './attachment-chip';

interface MentionChipProps {
  mention: MentionAttachment;
  variant?: 'default' | 'compact';
  onRemove?: () => void;
}

export function MentionChip({
  mention,
  variant = 'default',
  onRemove,
}: MentionChipProps) {
  return (
    <AttachmentChip
      variant={variant}
      onRemove={onRemove}
      className="bg-primary/10 text-primary"
    >
      <AtSign className={variant === 'compact' ? 'h-3 w-3' : 'h-3 w-3'} />
      <span>{mention.label}</span>
    </AttachmentChip>
  );
}
