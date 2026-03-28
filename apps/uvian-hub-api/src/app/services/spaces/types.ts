export interface Space {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl?: string | null;
  createdBy: string;
  settings: Record<string, unknown>;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  conversationCount: number;
  userRole: string;
  syncStatus: 'synced';
}

export interface SpaceMember {
  spaceId: string;
  userId: string;
  role: { name: string };
  joinedAt: string;
}

export interface SpaceStats {
  totalSpaces: number;
  ownedSpaces: number;
  memberSpaces: number;
  totalMembers: number;
  totalConversations: number;
}

export interface CreateSpaceInput {
  id?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  settings?: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface UpdateSpaceInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  settings?: Record<string, unknown>;
  isPrivate?: boolean;
}

export interface SpacesScopedService {
  getSpaces(): Promise<Space[]>;
  getSpace(spaceId: string): Promise<Space>;
  getSpaceMembers(spaceId: string): Promise<SpaceMember[]>;
  getSpaceStats(userId: string): Promise<SpaceStats>;
  createSpace(userId: string, data: CreateSpaceInput): Promise<Space>;
  updateSpace(
    userId: string,
    spaceId: string,
    data: UpdateSpaceInput
  ): Promise<Space>;
  deleteSpace(userId: string, spaceId: string): Promise<{ success: boolean }>;
  inviteMember(
    userId: string,
    spaceId: string,
    targetUserId: string,
    role: { name: string }
  ): Promise<SpaceMember>;
  removeMember(
    userId: string,
    spaceId: string,
    targetUserId: string
  ): Promise<{ success: boolean }>;
  updateMemberRole(
    userId: string,
    spaceId: string,
    targetUserId: string,
    role: { name: string }
  ): Promise<SpaceMember>;
}

export interface SpacesAdminService {
  // Placeholder for future admin-only methods
}

export interface CreateSpacesServiceConfig {}
