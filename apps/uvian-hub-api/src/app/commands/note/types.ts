import { Note } from '../../services/note/types';
import type { HubEventEmitter } from '../../plugins/event-emitter';

export interface CreateNoteCommandInput {
  userId: string;
  spaceId: string;
  title: string;
  body?: string;
  attachments?: unknown[];
}

export interface CreateNoteCommandOutput {
  note: Note;
}

export interface UpdateNoteCommandInput {
  userId: string;
  noteId: string;
  title?: string;
  body?: string;
  attachments?: unknown[];
}

export interface UpdateNoteCommandOutput {
  note: Note;
}

export interface DeleteNoteCommandInput {
  userId: string;
  noteId: string;
}

export interface DeleteNoteCommandOutput {
  success: boolean;
}

export interface CommandContext {
  eventEmitter?: HubEventEmitter;
}
