export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ProfileSearchFilters {
  query?: string;
  sortBy?: 'relevance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProfileSearchResponse {
  profiles: Profile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  filters: {
    query: string;
    sortBy: 'relevance' | 'createdAt';
    searchFields: string[];
  };
}

export interface CreateProfileRequest {
  Body: CreateProfilePayload;
}

export interface UpdateProfileRequest {
  Params: {
    profileId: string;
  };
  Body: UpdateProfilePayload;
}

export interface DeleteProfileRequest {
  Params: {
    profileId: string;
  };
}

export interface GetProfileRequest {
  Params: {
    profileId: string;
  };
}

export type SearchProfilesRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};
