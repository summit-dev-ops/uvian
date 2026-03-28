export interface PostContent {
  id: string;
  contentType: 'note' | 'asset' | 'external';
  noteId: string | null;
  assetId: string | null;
  url: string | null;
}

export interface Post {
  id: string;
  spaceId: string;
  userId: string;
  contents: PostContent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  id?: string;
  spaceId: string;
  userId: string;
}

export interface PostScopedService {
  getPostsBySpace(
    spaceId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<{
    items: Post[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
  getPost(postId: string): Promise<Post>;
  createPost(data: CreatePostInput): Promise<Post>;
  deletePost(postId: string, userId: string): Promise<{ success: boolean }>;
}

export interface PostAdminService {
  // Placeholder for future admin-only methods
}

export interface CreatePostServiceConfig {}
