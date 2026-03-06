import type { Attachment } from './shared/attachment.types';

export interface Note {
  id: string;
  spaceId: string;
  ownerUserId: string;
  title: string;
  body: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  id?: string;
  spaceId: string;
  title: string;
  body?: string;
  attachments?: Attachment[];
}

export interface UpdateNotePayload {
  title?: string;
  body?: string;
  attachments?: Attachment[];
}

export interface CreateNoteRequest {
  Body: CreateNotePayload;
  Params: {
    spaceId: string;
  };
}

export interface UpdateNoteRequest {
  Body: UpdateNotePayload;
  Params: {
    spaceId: string;
    noteId: string;
  };
}

export interface GetSpaceNotesRequest {
  Params: {
    spaceId: string;
  };
  Querystring: {
    limit?: number;
    cursor?: string;
  };
}

export interface GetNoteRequest {
  Params: {
    spaceId: string;
    noteId: string;
  };
}

export interface DeleteNoteRequest {
  Params: {
    spaceId: string;
    noteId: string;
  };
}
