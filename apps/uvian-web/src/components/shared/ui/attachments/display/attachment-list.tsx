'use client';

import { useMemo } from 'react';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import {
  isImageAttachment,
  isMentionAttachment,
  isLinkAttachment,
  isFileAttachment,
} from '~/lib/domains/shared/attachments/utils';
import { ImageGallery } from './image-gallery';
import { LinkList } from './link-list';
import { MentionChips } from './mention-chips';

interface AttachmentListProps {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
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
    () => attachmentsList.filter(isFileAttachment),
    [attachmentsList]
  );

  if (attachmentsList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <MentionChips mentions={mentions} />
      <ImageGallery images={images} />
      <LinkList links={links} files={files} />
    </div>
  );
}
