'use client';

import { useMemo } from 'react';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import {
  isImageAttachment,
  isMentionAttachment,
  isLinkAttachment,
} from '~/lib/domains/shared/attachments/utils';
import { MentionChips } from './mention-chips';
import { ImageChips } from './image-chips';
import { LinkChips } from './link-chips';
import { FileChips } from './file-chips';

interface AttachmentChipsProps {
  attachments: Attachment[];
}

export function AttachmentChips({ attachments }: AttachmentChipsProps) {
  const attachmentsList = attachments || [];

  const mentions = useMemo(
    () => attachmentsList.filter(isMentionAttachment),
    [attachmentsList]
  );

  const images = useMemo(
    () => attachmentsList.filter(isImageAttachment),
    [attachmentsList]
  );

  const links = useMemo(
    () => attachmentsList.filter(isLinkAttachment),
    [attachmentsList]
  );

  const files = useMemo(
    () =>
      attachmentsList.filter((a) => a.type === 'file' && !isImageAttachment(a)),
    [attachmentsList]
  );

  if (attachmentsList.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <MentionChips mentions={mentions} />
      <ImageChips images={images} />
      <LinkChips links={links} />
      <FileChips files={files} />
    </div>
  );
}
