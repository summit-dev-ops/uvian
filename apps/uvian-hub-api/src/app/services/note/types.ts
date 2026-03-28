export interface Note {
  id: string;
  spaceId: string;
  ownerUserId: string;
  title: string;
  body: string | null;
  attachments: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  id?: string;
  spaceId: string;
  title: string;
  body?: string;
  attachments?: unknown[];
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  attachments?: unknown[];
}

export interface NoteScopedService {
  getNotesBySpace(
    spaceId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<{
    items: Note[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
  getNote(noteId: string): Promise<Note>;
  createNote(userId: string, data: CreateNoteInput): Promise<Note>;
  updateNote(
    userId: string,
    noteId: string,
    data: UpdateNoteInput
  ): Promise<Note>;
  deleteNote(userId: string, noteId: string): Promise<{ success: boolean }>;
}

export interface NoteAdminService {
  // Placeholder for future admin-only methods
}

export interface CreateNoteServiceConfig {}
