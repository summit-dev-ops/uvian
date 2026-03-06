export type AttachmentType = 'mention' | 'file' | 'link';

export type MentionAttachment = {
  type: 'mention';
  key: string;
  userId: string;
  label: string;
};

export type FileAttachment = {
  type: 'file';
  key: string;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export type LinkAttachment = {
  type: 'link';
  key: string;
  url: string;
};

export type Attachment = MentionAttachment | FileAttachment | LinkAttachment;
