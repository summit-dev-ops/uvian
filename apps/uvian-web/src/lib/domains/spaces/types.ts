// ============================================================================
// SPACES DOMAIN TYPES
// ============================================================================

// UI Types - Transformed for frontend consumption
export type SpaceUI = {
  id: string;
  name: string;
  resourceScopeId?: string;
  description?: string;
  coverUrl?: string;
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
  userId: string;
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
  coverUrl?: string;
  avatarUrl?: string;
  settings?: Record<string, any>;
  isPrivate?: boolean;
};

export type UpdateSpacePayload = {
  id: string;
} & Partial<CreateSpacePayload>;

export type InviteSpaceMemberPayload = {
  spaceId: string;
  userId: string;
  role?: SpaceMemberRole;
};

export type RemoveSpaceMemberPayload = {
  spaceId: string;
  userId: string;
};

export type UpdateSpaceMemberRolePayload = {
  spaceId: string;
  userId: string;
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
