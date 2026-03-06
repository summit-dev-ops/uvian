/**
 * Notes Domain Types
 */

import type { ProfileUI } from '~/lib/domains/profile/types';
import type { Attachment } from '~/lib/domains/shared/attachments/types';

export interface NoteUI {
  id: string;
  spaceId: string;
  ownerUserId: string;
  title: string;
  body: string | null;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  ownerProfile?: ProfileUI;
}

export interface NotesResponse {
  items: NoteUI[];
  nextCursor: string | null;
  hasMore: boolean;
}
