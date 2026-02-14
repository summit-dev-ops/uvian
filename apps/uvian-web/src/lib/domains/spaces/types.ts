// ============================================================================
// SPACES DOMAIN TYPES
// ============================================================================

// UI Types - Transformed for frontend consumption
export type SpaceUI = {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  settings: Record<string, any>;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  conversationCount?: number;
  userRole?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
};

export type SpaceMemberUI = {
  spaceId: string;
  profileId: string;
  role: SpaceMemberRole;
  joinedAt: string;
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
  role?: SpaceMemberRole;
};

export type RemoveSpaceMemberPayload = {
  spaceId: string;
  profileId: string;
};

export type UpdateSpaceMemberRolePayload = {
  spaceId: string;
  profileId: string;
  role: SpaceMemberRole;
};

export type SpaceMemberRole = {
  name: 'owner' | 'admin' | 'member';
};

// Response Types
export type SpaceStats = {
  totalSpaces: number;
  ownedSpaces: number;
  memberSpaces: number;
  totalMembers: number;
  totalConversations: number;
};
