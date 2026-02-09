import { supabase } from './supabase.service';
import {
  Space,
  SpaceMember,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  SpaceWithMembers,
  SpaceConversation,
  SpaceStats,
} from '../types/spaces.types';

export class SpacesService {
  async createSpace(userId: string, data: CreateSpaceRequest): Promise<Space> {
    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Create the space
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert({
        id: data.id,
        name: data.name,
        description: data.description,
        avatar_url: data.avatar_url,
        settings: data.settings || {},
        is_private: data.is_private || false,
        created_by: profile.id,
      })
      .select()
      .single();

    if (spaceError) {
      throw new Error(`Failed to create space: ${spaceError.message}`);
    }

    // Add creator as admin member
    await this.inviteSpaceMember(space.id, profile.id, {
      name: 'admin',
    });

    return space;
  }

  async getSpaces(userId: string): Promise<Space[]> {
    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      return [];
    }

    // Get spaces where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('space_members')
      .select('space_id, role')
      .eq('profile_id', profile.id);

    if (membershipError) {
      throw new Error(
        `Failed to fetch space memberships: ${membershipError.message}`
      );
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const spaceIds = memberships.map((m) => m.space_id);

    // Get space details with member counts
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select(
        `
        *,
        space_members!inner(profile_id),
        conversations(id)
      `
      )
      .in('id', spaceIds)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch spaces: ${error.message}`);
    }

    // Transform and enrich data
    return (spaces || []).map((space) => ({
      id: space.id,
      name: space.name,
      description: space.description,
      avatar_url: space.avatar_url,
      created_by: space.created_by,
      settings: space.settings,
      is_private: space.is_private,
      created_at: space.created_at,
      updated_at: space.updated_at,
      member_count: space.space_members?.length || 0,
      conversation_count: space.conversations?.length || 0,
      user_role:
        memberships.find((m) => m.space_id === space.id)?.role?.name ||
        'member',
    }));
  }

  async getSpace(
    id: string,
    userId: string
  ): Promise<SpaceWithMembers | undefined> {
    // Verify user has access to this space
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Get space details
    const { data: space, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch space: ${error.message}`);
    }

    if (!space) {
      return undefined;
    }

    // Get space members with profile details
    const { data: members, error: membersError } = await supabase
      .from('space_members')
      .select(
        `
        *,
        profiles (
          id,
          display_name,
          avatar_url,
          type
        )
      `
      )
      .eq('space_id', id);

    if (membersError) {
      throw new Error(`Failed to fetch space members: ${membersError.message}`);
    }

    // Transform members data
    const transformedMembers: SpaceMember[] = (members || []).map((member) => ({
      space_id: member.space_id,
      profile_id: member.profile_id,
      role: member.role,
      joined_at: member.joined_at,
      profile: member.profiles
        ? {
            id: member.profiles.id,
            display_name: member.profiles.display_name,
            avatar_url: member.profiles.avatar_url,
            type: member.profiles.type,
          }
        : undefined,
    }));

    return {
      ...space,
      members: transformedMembers,
      member_count: transformedMembers.length,
    };
  }

  async updateSpace(
    id: string,
    userId: string,
    data: UpdateSpaceRequest
  ): Promise<Space> {
    // Verify user is the creator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const { data: space, error } = await supabase
      .from('spaces')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('created_by', profile.id) // Only creator can update
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update space: ${error.message}`);
    }

    return space;
  }

  async deleteSpace(id: string, userId: string): Promise<void> {
    // Verify user is the creator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', id)
      .eq('created_by', profile.id); // Only creator can delete

    if (error) {
      throw new Error(`Failed to delete space: ${error.message}`);
    }
  }

  async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
    const { data: members, error } = await supabase
      .from('space_members')
      .select(
        `
        *,
        profiles (
          id,
          display_name,
          avatar_url,
          type
        )
      `
      )
      .eq('space_id', spaceId);

    if (error) {
      throw new Error(`Failed to fetch space members: ${error.message}`);
    }

    // Transform members data
    return (members || []).map((member) => ({
      space_id: member.space_id,
      profile_id: member.profile_id,
      role: member.role,
      joined_at: member.joined_at,
      profile: member.profiles
        ? {
            id: member.profiles.id,
            display_name: member.profiles.display_name,
            avatar_url: member.profiles.avatar_url,
            type: member.profiles.type,
          }
        : undefined,
    }));
  }

  async inviteSpaceMember(
    spaceId: string,
    profileId: string,
    role: any = { name: 'member' }
  ): Promise<SpaceMember> {
    const { data: membership, error } = await supabase
      .from('space_members')
      .insert({
        space_id: spaceId,
        profile_id: profileId,
        role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to invite member: ${error.message}`);
    }

    // Get profile details for the response
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, type')
      .eq('id', profileId)
      .single();

    return {
      space_id: membership.space_id,
      profile_id: membership.profile_id,
      role: membership.role,
      joined_at: membership.joined_at,
      profile: profileError
        ? undefined
        : {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            type: profile.type,
          },
    };
  }

  async removeSpaceMember(spaceId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from('space_members')
      .delete()
      .eq('space_id', spaceId)
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async updateSpaceMemberRole(
    spaceId: string,
    profileId: string,
    role: any
  ): Promise<SpaceMember> {
    const { data: membership, error } = await supabase
      .from('space_members')
      .update({ role })
      .eq('space_id', spaceId)
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    // Get profile details for the response
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, type')
      .eq('id', profileId)
      .single();

    return {
      space_id: membership.space_id,
      profile_id: membership.profile_id,
      role: membership.role,
      joined_at: membership.joined_at,
      profile: profileError
        ? undefined
        : {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            type: profile.type,
          },
    };
  }

  async getSpaceConversations(spaceId: string): Promise<SpaceConversation[]> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(
        `
        id,
        title,
        space_id,
        created_at,
        updated_at,
        messages (
          content,
          role,
          created_at
        ),
        conversation_members (profile_id)
      `
      )
      .eq('space_id', spaceId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch space conversations: ${error.message}`);
    }

    return (conversations || []).map((conv) => {
      const lastMessage =
        conv.messages && conv.messages.length > 0
          ? {
              content: conv.messages[conv.messages.length - 1].content,
              role: conv.messages[conv.messages.length - 1].role,
              created_at: conv.messages[conv.messages.length - 1].created_at,
            }
          : undefined;

      return {
        id: conv.id,
        title: conv.title,
        space_id: conv.space_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message: lastMessage,
        member_count: conv.conversation_members?.length || 0,
      };
    });
  }

  async getSpaceStats(userId: string): Promise<SpaceStats> {
    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      return {
        total_spaces: 0,
        owned_spaces: 0,
        member_spaces: 0,
        total_members: 0,
        total_conversations: 0,
      };
    }

    // Get space membership counts
    const { data: ownedSpaces } = await supabase
      .from('spaces')
      .select('id', { count: 'exact' })
      .eq('created_by', profile.id);

    const { data: memberSpaces } = await supabase
      .from('space_members')
      .select('space_id')
      .eq('profile_id', profile.id);

    const memberSpaceIds = (memberSpaces || []).map((m) => m.space_id);
    const ownedSpaceIds = (ownedSpaces || []).map((s) => s.id);

    // Get total conversations in user's spaces
    let totalConversations = 0;
    if (memberSpaceIds.length > 0) {
      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('space_id', memberSpaceIds);
      totalConversations = count || 0;
    }

    // Get total members across user's spaces
    let totalMembers = 0;
    if (ownedSpaceIds.length > 0) {
      const { count } = await supabase
        .from('space_members')
        .select('*', { count: 'exact', head: true })
        .in('space_id', ownedSpaceIds);
      totalMembers = count || 0;
    }

    return {
      total_spaces: memberSpaceIds.length,
      owned_spaces: ownedSpaceIds.length,
      member_spaces: memberSpaceIds.length - ownedSpaceIds.length,
      total_members: totalMembers,
      total_conversations: totalConversations,
    };
  }
}

export const spacesService = new SpacesService();
