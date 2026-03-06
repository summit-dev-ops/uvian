import type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
} from './shared/attachment.types';

export type {
  Attachment,
  AttachmentType,
  MentionAttachment,
  FileAttachment,
  LinkAttachment,
};

export type PostType = 'asset' | 'note' | 'external';

export interface Post {
  id: string;
  spaceId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostContentItem {
  type: 'note' | 'asset' | 'external';
  note?: { title: string; body?: string; attachments?: any[] };
  noteId?: string;
  assetId?: string;
  url?: string;
}

export interface CreatePostPayload {
  id?: string;
  contents: PostContentItem[];
}

export interface CreatePostRequest {
  Body: CreatePostPayload;
  Params: {
    spaceId: string;
  };
}

export interface GetSpacePostsRequest {
  Params: {
    spaceId: string;
  };
  Querystring: {
    limit?: number;
    cursor?: string;
  };
}

export interface GetPostRequest {
  Params: {
    id: string;
  };
}

export interface DeletePostRequest {
  Params: {
    id: string;
  };
}
