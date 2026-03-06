'use client';

import type { LinkAttachment } from '~/lib/domains/shared/attachments/types';
import { LinkChip } from '../components/chips';

interface LinkChipsProps {
  links: LinkAttachment[];
}

export function LinkChips({ links }: LinkChipsProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {links.map((link) => (
        <LinkChip key={link.key} link={link} />
      ))}
    </div>
  );
}
