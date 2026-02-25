/**
 * Posts Domain Types
 */

export interface PostUI {
  id: string;
  spaceId: string;
  profileId: string;
  contentType: 'text' | 'url';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostsResponse {
  items: PostUI[];
  nextCursor: string | null;
  hasMore: boolean;
}
