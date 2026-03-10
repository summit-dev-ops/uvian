'use client';

import { useMemo } from 'react';
import type { Attachment } from '~/lib/domains/shared/attachments/types';
import {
  isImageAttachment,
  isMentionAttachment,
  isLinkAttachment,
} from '~/lib/domains/shared/attachments/utils';

const MENTION_REGEX = /\[@ id="([^"]+)" label="([^"]+)"\]/g;

interface UseProcessedMessageOptions {
  content: string;
  attachments?: Attachment[];
}

export function useProcessedMessage({
  content,
  attachments = [],
}: UseProcessedMessageOptions) {
  const mentions = useMemo(
    () => attachments.filter(isMentionAttachment),
    [attachments]
  );

  const processedContent = useMemo(() => {
    const labelToUserId = new Map(mentions.map((m) => [m.label, m.userId]));

    return content.replace(MENTION_REGEX, (_, id, label) => {
      const userId = labelToUserId.get(label) || id;
      return `[${label}](/users/${userId})`;
    });
  }, [content, mentions]);

  const images = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments]
  );

  const links = useMemo(
    () => attachments.filter(isLinkAttachment),
    [attachments]
  );

  const files = useMemo(
    () => attachments.filter((a) => a.type === 'file' && !isImageAttachment(a)),
    [attachments]
  );

  return {
    processedContent,
    mentions,
    images,
    links,
    files,
  };
}
