import { EVENT_TYPE_PREFIX } from '../constants';

const prefix = EVENT_TYPE_PREFIX;

export const ContentEvents = {
  POST_CREATED: `${prefix}.content.post_created`,
  POST_UPDATED: `${prefix}.content.post_updated`,
  POST_DELETED: `${prefix}.content.post_deleted`,
  NOTE_CREATED: `${prefix}.content.note_created`,
  NOTE_UPDATED: `${prefix}.content.note_updated`,
  NOTE_DELETED: `${prefix}.content.note_deleted`,
  ASSET_UPLOADED: `${prefix}.content.asset_uploaded`,
  ASSET_DELETED: `${prefix}.content.asset_deleted`,
} as const;

export type ContentEventType =
  (typeof ContentEvents)[keyof typeof ContentEvents];

export interface PostCreatedData {
  postId: string;
  content: string;
  authorId: string;
  spaceId?: string;
}

export interface PostUpdatedData {
  postId: string;
  content?: string;
  updatedBy: string;
}

export interface PostDeletedData {
  postId: string;
  deletedBy: string;
}

export interface NoteCreatedData {
  noteId: string;
  title: string;
  content: string;
  createdBy: string;
}

export interface NoteUpdatedData {
  noteId: string;
  title?: string;
  content?: string;
  updatedBy: string;
}

export interface NoteDeletedData {
  noteId: string;
  deletedBy: string;
}

export interface AssetUploadedData {
  assetId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  spaceId?: string;
  conversationId?: string;
}

export interface AssetDeletedData {
  assetId: string;
  deletedBy: string;
}

export type ContentEventData =
  | PostCreatedData
  | PostUpdatedData
  | PostDeletedData
  | NoteCreatedData
  | NoteUpdatedData
  | NoteDeletedData
  | AssetUploadedData
  | AssetDeletedData;
