// ============================================================================
// SPACES DOMAIN TYPES
// ============================================================================

// API Types - Raw data from backend
export type SpaceAPI = {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  settings: Record<string, any>;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  conversation_count?: number;
  user_role?: string;
};

export type SpaceMemberAPI = {
  space_id: string;
  profile_id: string;
  role: any;
  joined_at: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    type: string;
  };
};

// UI Types - Transformed for frontend consumption
export type SpaceUI = {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  settings: Record<string, any>;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  conversationCount?: number;
  userRole?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
};

export type SpaceMemberUI = {
  spaceId: string;
  profileId: string;
  role: any;
  joinedAt: Date;
  profile?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    type: string;
  };
};

// Payload Types for API operations
export type CreateSpacePayload = {
  name: string;
  description?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  is_private?: boolean;
};

export type UpdateSpacePayload = {
  id: string;
} & Partial<CreateSpacePayload>;

export type InviteSpaceMemberPayload = {
  spaceId: string;
  profileId: string;
  role?: any;
};

export type RemoveSpaceMemberPayload = {
  spaceId: string;
  profileId: string;
};

export type UpdateSpaceMemberRolePayload = {
  spaceId: string;
  profileId: string;
  role: any;
};

// Response Types
export type SpaceStats = {
  total_spaces: number;
  owned_spaces: number;
  member_spaces: number;
  total_members: number;
  total_conversations: number;
};

export type SpaceConversation = {
  id: string;
  title: string;
  space_id: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
  };
  member_count?: number;
};

// Union types for API responses
export type SpaceResponse = SpaceAPI | SpaceUI;
export type SpaceMemberResponse = SpaceMemberAPI | SpaceMemberUI;

// Error Types
export type SpacesError = {
  message: string;
  code?: string;
  field?: string;
};

// Constants
export const SPACE_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const SPACE_VISIBILITY = {
  PUBLIC: false,
  PRIVATE: true,
} as const;
