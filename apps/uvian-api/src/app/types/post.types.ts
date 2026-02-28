export interface Post {
  id: string;
  spaceId: string;
  profileId: string;
  contentType: 'text' | 'url';
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  contentType: 'text' | 'url';
  content: string;
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
