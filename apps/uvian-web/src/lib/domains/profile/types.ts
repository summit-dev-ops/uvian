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
  userId: string;
  type: ProfileType;
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
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
  coverUrl?: string | null;
  bio?: string | null;
  agentConfig?: any;
  publicFields?: Record<string, any>;
  isActive?: boolean;
  type?: ProfileType;
};

// ============================================================================
// User Search Types (merged user + profile)
// ============================================================================

export type UserSearchResult = {
  userId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  type: 'human' | 'agent';
};

export type UserSearchParams = {
  query?: string;
  type?: ('human' | 'agent')[];
  page?: number;
  limit?: number;
  searchContext?: {
    type: 'space' | 'conversation';
    id: string;
  };
};

export type UserSearchResults = {
  users: UserSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  filters: {
    query: string;
    searchFields: string[];
  };
};

// ============================================================================
// Invite Types
// ============================================================================

export type InviteMemberData = {
  userId: string;
  profileId: string;
  displayName: string;
  role: 'admin' | 'member';
};
