/**
 * Posts Domain Types
 */

import type { ProfileUI } from '~/lib/domains/profile/types';

export interface PostUI {
  id: string;
  spaceId: string;
  userId: string;
  contentType: 'text' | 'url';
  content: string;
  createdAt: string;
  updatedAt: string;
  authorProfile?: ProfileUI;
  conversationId?: string;
}

export interface PostsResponse {
  items: PostUI[];
  nextCursor: string | null;
  hasMore: boolean;
}
