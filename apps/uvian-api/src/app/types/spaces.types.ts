export interface Space {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  createdBy: string;
  settings: SpaceSettings;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  conversationCount?: number;
  userRole?: string;
}

export interface SpaceMember {
  spaceId: string;
  profileId: string;
  role: SpaceMemberRole;
  joinedAt: string;
}

export interface SpaceMemberRole {
  name: 'admin' | 'member' | 'owner';
}

export type SpaceSettings = Record<string, any>;

export interface CreateSpacePayload {
  id?: string;
  name: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  settings?: SpaceSettings;
  isPrivate?: boolean;
}

export interface UpdateSpacePayload {
  name?: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  settings?: SpaceSettings;
  isPrivate?: boolean;
}

export interface InviteSpaceMemberPayload {
  userId: string;
  role?: SpaceMemberRole;
}

export interface UpdateSpaceMemberRolePayload {
  role: SpaceMemberRole;
}

export interface SpaceWithMembers extends Space {
  members: SpaceMember[];
}

export interface SpaceStats {
  totalSpaces: number;
  ownedSpaces: number;
  memberSpaces: number;
  totalMembers: number;
  totalConversations: number;
}

export interface CreateSpaceRequest {
  Body: CreateSpacePayload;
}

export type GetSpacesRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export type GetSpaceStatsRequest = {
  Querystring?: Record<string, unknown>;
  Params?: Record<string, unknown>;
  Body?: Record<string, unknown>;
};

export interface GetSpaceRequest {
  Params: {
    spaceId: string;
  };
}

export interface UpdateSpaceRequest {
  Params: {
    spaceId: string;
  };
  Body: UpdateSpacePayload;
}

export interface DeleteSpaceRequest {
  Params: {
    spaceId: string;
  };
}

export interface GetSpaceMembersRequest {
  Params: {
    spaceId: string;
  };
}

export interface InviteSpaceMemberRequest {
  Params: {
    spaceId: string;
  };
  Body: InviteSpaceMemberPayload;
}

export interface RemoveSpaceMemberRequest {
  Params: {
    spaceId: string;
    userId: string;
  };
}

export interface UpdateSpaceMemberRoleRequest {
  Params: {
    spaceId: string;
    userId: string;
  };
  Body: UpdateSpaceMemberRolePayload;
}
