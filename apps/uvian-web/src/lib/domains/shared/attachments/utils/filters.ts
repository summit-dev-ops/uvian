import type {
  Attachment,
  FileAttachment,
  MentionAttachment,
  LinkAttachment,
} from '../types';

export function isImageAttachment(
  attachment: Attachment
): attachment is FileAttachment {
  return (
    attachment.type === 'file' && !!attachment.mimeType?.startsWith('image/')
  );
}

export function isMentionAttachment(
  attachment: Attachment
): attachment is MentionAttachment {
  return attachment.type === 'mention';
}

export function isLinkAttachment(
  attachment: Attachment
): attachment is LinkAttachment {
  return attachment.type === 'link';
}

export function isFileAttachment(
  attachment: Attachment
): attachment is FileAttachment {
  return attachment.type === 'file';
}

export function isNonImageFileAttachment(
  attachment: Attachment
): attachment is FileAttachment {
  return attachment.type === 'file' && !isImageAttachment(attachment);
}
