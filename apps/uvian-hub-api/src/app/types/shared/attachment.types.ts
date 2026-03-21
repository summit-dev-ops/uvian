export type AttachmentType = 'mention' | 'file' | 'link';

export interface MentionAttachment {
  type: 'mention';
  key: string;
  userId: string;
  label: string;
}

export interface FileAttachment {
  type: 'file';
  key: string;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface LinkAttachment {
  type: 'link';
  key: string;
  url: string;
}

export type Attachment = MentionAttachment | FileAttachment | LinkAttachment;
