export interface Space {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  settings: Record<string, any>;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields for frontend
  member_count?: number;
  conversation_count?: number;
  user_role?: string;
}

export interface SpaceMember {
  space_id: string;
  profile_id: string;
  role: any;
  joined_at: string;
  // Extended fields from profiles
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    type: 'human' | 'agent' | 'system' | 'admin';
  };
}

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
  role?: any;
}

export interface UpdateSpaceMemberRoleRequest {
  role: any;
}

export interface SpaceWithMembers extends Space {
  members: SpaceMember[];
}

export interface SpaceConversation {
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
}

export interface SpaceStats {
  total_spaces: number;
  owned_spaces: number;
  member_spaces: number;
  total_members: number;
  total_conversations: number;
}
