import { adminSupabase } from '../clients/supabase.client';
import {
  Space,
  SpaceMember,
  CreateSpaceRequest,
  UpdateSpaceRequest,
  SpaceWithMembers,
  SpaceStats,
  SpaceMemberRole,
} from '../types/spaces.types';
import { SupabaseClient } from '@supabase/supabase-js';

export class SpacesService {
  /**
   * Private Helper: Verifies the profile belongs to the user and
   * returns the role of that profile in a specific space.
   */
  private async getUserRoleInSpace(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<SpaceMemberRole['name'] | null> {
    const { data, error } = await userClient
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('profile_id', profileId)
      .single();

    if (error || !data) return null;
    return (data.role as SpaceMemberRole).name;
  }

  /**
   * Private Helper: Verifies profile ownership via User Client
   */
  private async verifyProfileOwnership(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<boolean> {
    const { data, error } = await userClient
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single();

    return !error && !!data;
  }

  async createSpace(
    userClient: SupabaseClient,
    profileId: string,
    data: CreateSpaceRequest
  ): Promise<Space> {
    if (!(await this.verifyProfileOwnership(userClient, profileId))) {
      throw new Error('Unauthorized: Profile not owned by user');
    }

    const { data: space, error: spaceError } = await adminSupabase
      .from('spaces')
      .insert({
        id: data.id,
        name: data.name,
        description: data.description,
        avatar_url: data.avatar_url,
        settings: data.settings || {},
        is_private: data.is_private || false,
        created_by: profileId,
      })
      .select()
      .single();

    if (spaceError) throw new Error(spaceError.message);

    // 2. Add creator as 'owner'
    await adminSupabase.from('space_members').insert({
      space_id: space.id,
      profile_id: profileId,
      role: { name: 'owner' },
    });

    return space;
  }

  async getSpaces(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<Space[]> {
    // RLS handles visibility. We filter by profileId to show spaces this profile is in.
    const { data: spaces, error } = await userClient
      .from('spaces')
      .select(
        `
        *,
        space_members!inner(profile_id, role),
        conversations(id)
      `
      )
      .eq('space_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (spaces || []).map((space: any) => ({
      ...space,
      member_count: space.space_members?.length || 0,
      conversation_count: space.conversations?.length || 0,
      user_role:
        space.space_members.find((m: any) => m.profile_id === profileId)?.role
          ?.name || 'member',
    }));
  }

  async getSpace(
    userClient: SupabaseClient,
    spaceId: string
  ): Promise<SpaceWithMembers | undefined> {
    // RLS handles visibility. If user isn't a member/space isn't public, data is null.
    const { data: space, error } = await userClient
      .from('spaces')
      .select(
        `
        *,
        space_members (
          *,
          profiles (id, display_name, avatar_url, type)
        )
      `
      )
      .eq('id', spaceId)
      .single();

    if (error) return undefined;

    const transformedMembers: SpaceMember[] = (space.space_members || []).map(
      (m: any) => ({
        space_id: m.space_id,
        profile_id: m.profile_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: m.profiles,
      })
    );

    return {
      ...space,
      members: transformedMembers,
      member_count: transformedMembers.length,
    };
  }

  async updateSpace(
    userClient: SupabaseClient,
    id: string,
    profileId: string,
    data: UpdateSpaceRequest
  ): Promise<Space> {
    const role = await this.getUserRoleInSpace(userClient, id, profileId);
    if (role !== 'owner' && role !== 'admin') {
      throw new Error('Unauthorized: Only admins or owners can update spaces');
    }

    const { data: space, error } = await adminSupabase
      .from('spaces')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return space;
  }

  async deleteSpace(
    userClient: SupabaseClient,
    id: string,
    profileId: string
  ): Promise<void> {
    const role = await this.getUserRoleInSpace(userClient, id, profileId);
    if (role !== 'owner') {
      throw new Error('Unauthorized: Only the owner can delete a space');
    }

    const { error } = await adminSupabase.from('spaces').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async inviteSpaceMember(
    userClient: SupabaseClient,
    spaceId: string,
    inviterProfileId: string,
    targetProfileId: string,
    role: SpaceMemberRole
  ): Promise<SpaceMember> {
    const inviterRole = await this.getUserRoleInSpace(
      userClient,
      spaceId,
      inviterProfileId
    );
    if (inviterRole !== 'owner' && inviterRole !== 'admin') {
      throw new Error('Unauthorized: Insufficient permissions to invite');
    }

    const { data: membership, error } = await adminSupabase
      .from('space_members')
      .insert({ space_id: spaceId, profile_id: targetProfileId, role })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return membership;
  }

  async getSpaceMembers(
  userClient: SupabaseClient,
  spaceId: string,
): Promise<SpaceMember[]> {
  // RLS handles visibility: 
  // If user isn't in the space (and it's private), 'members' will be an empty array.
  const { data: members, error } = await userClient
    .from('space_members')
    .select(`
      *,
      profiles!inner (
        id,
        display_name,
        avatar_url,
        type
      )
    `)
    .eq('space_id', spaceId);

  if (error) {
    // If the error is a "403 Forbidden" or similar, RLS is doing its job.
    throw new Error(`Failed to fetch space members: ${error.message}`);
  }

  // Transform members data
  return (members || []).map((member: any) => ({
    space_id: member.space_id,
    profile_id: member.profile_id,
    role: member.role,
    joined_at: member.joined_at,
    profile: {
      id: member.profiles.id,
      display_name: member.profiles.display_name,
      avatar_url: member.profiles.avatar_url,
      type: member.profiles.type,
    },
  }));
}

  async removeSpaceMember(
    userClient: SupabaseClient,
    spaceId: string,
    removerProfileId: string,
    targetProfileId: string
  ): Promise<void> {
    const isSelf = removerProfileId === targetProfileId;
    const removerRole = await this.getUserRoleInSpace(
      userClient,
      spaceId,
      removerProfileId
    );

    // Can remove if: I am an admin/owner OR I am removing myself
    if (!isSelf && removerRole !== 'owner' && removerRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { error } = await adminSupabase
      .from('space_members')
      .delete()
      .eq('space_id', spaceId)
      .eq('profile_id', targetProfileId);

    if (error) throw new Error(error.message);
  }

  async updateSpaceMemberRole(
    userClient: SupabaseClient,
    spaceId: string,
    updaterProfileId: string,
    targetProfileId: string,
    newRole: SpaceMemberRole
  ): Promise<SpaceMember> {
    const updaterRole = await this.getUserRoleInSpace(
      userClient,
      spaceId,
      updaterProfileId
    );

    if (updaterRole !== 'owner' && updaterRole !== 'admin') {
      throw new Error('Unauthorized');
    }

    const { data: membership, error } = await adminSupabase
      .from('space_members')
      .update({ role: newRole })
      .eq('space_id', spaceId)
      .eq('profile_id', targetProfileId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return membership;
  }

  async getSpaceStats(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<SpaceStats> {
    // Rely on User Client + RLS for automatic filtering
    const { data: spaces } = await userClient
      .from('spaces')
      .select('id, created_by, space_members!inner(profile_id)');

    if (!spaces)
      return {
        total_spaces: 0,
        owned_spaces: 0,
        member_spaces: 0,
        total_members: 0,
        total_conversations: 0,
      };

    const totalSpaceIds = spaces.map((s) => s.id);
    const ownedSpaces = spaces.filter((s) => s.created_by === profileId);

    const { count: totalConvs } = await userClient
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('space_id', totalSpaceIds);

    const { count: totalMembs } = await userClient
      .from('space_members')
      .select('*', { count: 'exact', head: true })
      .in(
        'space_id',
        ownedSpaces.map((s) => s.id)
      );

    return {
      total_spaces: spaces.length,
      owned_spaces: ownedSpaces.length,
      member_spaces: spaces.length - ownedSpaces.length,
      total_members: totalMembs || 0,
      total_conversations: totalConvs || 0,
    };
  }
}

export const spacesService = new SpacesService();
