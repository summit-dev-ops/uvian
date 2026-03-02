'use client';

import { AtSign } from 'lucide-react';
import type { MentionAttachment } from '~/lib/domains/chat/types';

interface MentionChipsProps {
  mentions: MentionAttachment[];
}

export function MentionChips({ mentions }: MentionChipsProps) {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {mentions.map((mention, index) => (
        <span
          key={`${mention.userId}-${index}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full text-xs text-primary"
        >
          <AtSign className="h-3 w-3" />
          <span>{mention.label}</span>
        </span>
      ))}
    </div>
  );
}
