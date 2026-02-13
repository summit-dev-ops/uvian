
export type ProfileType = 'human' | 'agent' | 'system' | 'admin';

export interface Profile {
  id: string;
  authUserId?: string | null;
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

export interface CreateProfileData {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  type?: ProfileType;
}

export interface UpdateProfileData {
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
  type?: ('human' | 'agent')[];
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