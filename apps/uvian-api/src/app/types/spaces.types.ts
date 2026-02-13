export interface Space {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  settings: SpaceSettings;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  conversation_count?: number;
  user_role?: string;
}

export interface SpaceMember {
  space_id: string;
  profile_id: string;
  role: SpaceMemberRole;
  joined_at: string;
}

export interface SpaceMemberRole {
  name: "admin" | 'member' | 'owner';
}

export type SpaceSettings = Record<string, any>

export interface CreateSpaceRequest {
  id?: string;
  name: string;
  description?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  is_private?: boolean;
}

export interface UpdateSpaceRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  is_private?: boolean;
}

export interface InviteSpaceMemberRequest {
  profile_id: string;
  role?: SpaceMemberRole;
}

export interface UpdateSpaceMemberRoleRequest {
  role: SpaceMemberRole;
}

export interface SpaceWithMembers extends Space {
  members: SpaceMember[];
}


export interface SpaceStats {
  total_spaces: number;
  owned_spaces: number;
  member_spaces: number;
  total_members: number;
  total_conversations: number;
}
