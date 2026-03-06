'use client';

import type { MentionAttachment } from '~/lib/domains/shared/attachments/types';
import { MentionChip } from '../components/chips';

interface MentionChipsProps {
  mentions: MentionAttachment[];
}

export function MentionChips({ mentions }: MentionChipsProps) {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {mentions.map((mention) => (
        <MentionChip key={mention.key} mention={mention} />
      ))}
    </div>
  );
}
