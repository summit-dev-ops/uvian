/**
 * Posts Domain Types
 */

import type { ProfileUI } from '~/lib/domains/profile/types';
import type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
} from '~/lib/domains/shared/attachments/types';

export type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
};

export type PostContentType = 'note' | 'asset' | 'external';

export interface PostContent {
  id: string;
  contentType: PostContentType;
  noteId: string | null;
  assetId: string | null;
  url: string | null;
}

export interface PostUI {
  id: string;
  spaceId: string;
  userId: string;
  contents: PostContent[];
  createdAt: string;
  updatedAt: string;
  authorProfile?: ProfileUI;
}

export interface PostsResponse {
  items: PostUI[];
  nextCursor: string | null;
  hasMore: boolean;
}
