export type ProfileType = 'human' | 'agent' | 'system' | 'admin';

export interface Profile {
  id: string;
  userId?: string | null;
  type: ProfileType;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfilePayload {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  type?: ProfileType;
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  isActive?: boolean;
}

export interface SearchableField {
  name: string;
  weight: number;
  boost?: number;
}

export interface ProfileSearchFilters {
  query?: string;
  type?: string[];
  sortBy?: 'relevance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProfileSearchResponse {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  sortBy: 'relevance' | 'createdAt';
  query: string;
  searchFields: string[];
}

export interface RelevanceScore {
  profileId: string;
  score: number;
  matchedFields: string[];
}

// Request types for Fastify routes
export interface CreateProfileRequest {
  Body: CreateProfilePayload;
  Headers: {
    profileId: string;
  };
}

export interface UpdateProfileRequest {
  Params: {
    profileId: string;
  };
  Body: UpdateProfilePayload;
  Headers: {
    profileId: string;
  };
}

export interface DeleteProfileRequest {
  Params: {
    profileId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface GetProfileRequest {
  Params: {
    profileId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface SearchProfilesRequest {
  Querystring: {
    query?: string;
    type?: string | string[];
    sortBy?: 'relevance' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    page?: string;
    limit?: string;
  };
  Headers: {
    profileId: string;
  };
}
