export interface Space {
  id: string;
  name: string;
  description?: string;
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
  avatarUrl?: string;
  settings?: SpaceSettings;
  isPrivate?: boolean;
}

export interface UpdateSpacePayload {
  name?: string;
  description?: string;
  avatarUrl?: string;
  settings?: SpaceSettings;
  isPrivate?: boolean;
}

export interface InviteSpaceMemberPayload {
  profileId: string;
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
  Headers: {
    profileId: string;
  };
}

export interface GetSpacesRequest {
  Headers: {
    profileId: string;
  };
}

export interface GetSpaceStatsRequest {
  Headers: {
    profileId: string;
  };
}

export interface GetSpaceRequest {
  Params: {
    spaceId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface UpdateSpaceRequest {
  Params: {
    spaceId: string;
  };
  Body: UpdateSpacePayload;
  Headers: {
    profileId: string;
  };
}

export interface DeleteSpaceRequest {
  Params: {
    spaceId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface GetSpaceMembersRequest {
  Params: {
    spaceId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface InviteSpaceMemberRequest {
  Params: {
    spaceId: string;
  };
  Body: InviteSpaceMemberPayload;
  Headers: {
    profileId: string;
  };
}

export interface RemoveSpaceMemberRequest {
  Params: {
    spaceId: string;
    profileId: string;
  };
  Headers: {
    profileId: string;
  };
}

export interface UpdateSpaceMemberRoleRequest {
  Params: {
    spaceId: string;
    profileId: string;
  };
  Body: UpdateSpaceMemberRolePayload;
  Headers: {
    profileId: string;
  };
}
