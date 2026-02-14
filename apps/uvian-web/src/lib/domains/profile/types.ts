/**
 * User Domain Types
 *
 * Separates API types from UI types following the Transformer pattern.
 * Clear distinction between Users (authentication) and Profiles (user data).
 * All profile operations work consistently regardless of whether it's the current user or another user.
 */

export type ProfileType = 'human' | 'agent' | 'system' | 'admin';

// ============================================================================
// UI Types (Transformed for UI consumption)
// ============================================================================

export type ProfileUI = {
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
};


// ============================================================================
// User Store Types (Local UI state)
// ============================================================================

export type ProfileDraft = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  isActive?: boolean;
  type?: ProfileType;
};

export type ProfileSearchParams = {
  query?: string;
  type?: ('human' | 'agent')[];
  sortBy?: 'relevance' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type ProfileSearchResults = {
  profiles: ProfileUI[];
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
};
