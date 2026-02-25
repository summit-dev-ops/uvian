import { adminSupabase } from '../clients/supabase.client';
import {
  Space,
  SpaceMember,
  SpaceWithMembers,
  SpaceStats,
  SpaceMemberRole,
  CreateSpacePayload,
  UpdateSpacePayload,
} from '../types/spaces.types';
import { SupabaseClient } from '@supabase/supabase-js';

export class SpacesService {
  /**
   * SECURITY: Verifies the Auth User actually owns the profile.
   * This prevents User A from performing actions as User B (Spoofing).
   */
  private async verifyProfileOwnership(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<void> {
    const { data, error } = await userClient
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      throw new Error('Unauthorized: You do not own this profile');
    }
  }

  /**
   * Private Helper: Returns the role of a profile in a specific space.
   * Relies on verifyProfileOwnership being called BEFORE this.
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
  async createSpace(
    userClient: SupabaseClient,
    profileId: string,
    data: CreateSpacePayload
  ): Promise<Space> {
    // 1. SECURITY: Verify Ownership
    await this.verifyProfileOwnership(userClient, profileId);

    // 2. Create the space
    const { data: space, error: spaceError } = await adminSupabase
      .from('spaces')
      .insert({
        id: data.id,
        name: data.name,
        description: data.description,
        cover_image_url: data.coverUrl,
        avatar_url: data.avatarUrl,
        settings: data.settings || {},
        is_private: data.isPrivate || false,
        created_by: profileId,
      })
      .select()
      .single();

    if (spaceError) throw new Error(spaceError.message);

    // 3. Add creator as 'owner'
    await adminSupabase.from('space_members').insert({
      space_id: space.id,
      profile_id: profileId,
      role: { name: 'owner' },
    });

    // 4. Fetch the Scope ID (Trigger has finished by now)
    const { data: scope, error: scopeError } = await adminSupabase
      .from('resource_scopes')
      .select('id')
      .eq('space_id', space.id)
      .single();

    if (scopeError || !scope) {
      throw new Error('System Error: Resource Scope failed to initialize');
    }

    return {
      id: space.id,
      name: space.name,
      resourceScopeId: scope.id, // Successfully retrieved
      createdAt: space.created_at,
      createdBy: space.created_by,
      settings: space.settings,
      isPrivate: space.is_private,
      updatedAt: space.updated_at,
    };
  }

  async getSpaces(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<Space[]> {
    const { data: spaces, error } = await userClient
      .from('spaces')
      .select(
        `
        *,
        space_members!inner(profile_id, role),
        conversations(id),
        resource_scopes!space_id(id) 
      `
      )
      .eq('space_members.profile_id', profileId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (spaces || []).map((space: any) => ({
      id: space.id,
      name: space.name,
      description: space.description,
      resourceScopeId: space.resource_scopes?.[0]?.id,
      coverUrl: space.cover_image_url,
      avatarUrl: space.avatar_url,
      createdAt: space.created_at,
      createdBy: space.created_by,
      settings: space.settings,
      isPrivate: space.is_private,
      updatedAt: space.updated_at,
      memberCount: space.space_members?.length || 0,
      conversationCount: space.conversations?.length || 0,
      userRole:
        space.space_members.find((m: any) => m.profile_id === profileId)?.role
          ?.name || 'member',
    }));
  }

  async getSpace(
    userClient: SupabaseClient,
    spaceId: string,
    profileId: string
  ): Promise<SpaceWithMembers | undefined> {
    const { data: space, error } = await userClient
      .from('spaces')
      .select(
        `
        *,
        resource_scopes!space_id(id),
        space_members!inner (
          profile_id,
          role,
          joined_at,
          profiles (id, display_name, avatar_url, type)
        )
      `
      )
      .eq('id', spaceId)
      .eq('space_members.profile_id', profileId)
      .single();

    if (error || !space) return undefined;

    const members = await this.getSpaceMembers(userClient, spaceId);

    return {
      id: space.id,
      name: space.name,
      description: space.description,
      resourceScopeId: space.resource_scopes?.[0]?.id,
      coverUrl: space.cover_image_url,
      avatarUrl: space.avatar_url,
      createdAt: space.created_at,
      createdBy: space.created_by,
      conversationCount: space.conversation_count || 0,
      settings: space.settings,
      isPrivate: space.is_private,
      updatedAt: space.updated_at,
      members: members,
      memberCount: members.length,
    };
  }

  async updateSpace(
    userClient: SupabaseClient,
    id: string,
    profileId: string,
    data: UpdateSpacePayload
  ): Promise<Space> {
    await this.verifyProfileOwnership(userClient, profileId);

    const role = await this.getUserRoleInSpace(userClient, id, profileId);
    if (role !== 'owner' && role !== 'admin') {
      throw new Error('Unauthorized: Only admins or owners can update spaces');
    }

    const updateData: any = { ...data, updated_at: new Date().toISOString() };
    if (updateData.coverUrl !== undefined) {
      updateData.cover_image_url = updateData.coverUrl;
      delete updateData.coverUrl;
    }
    if (updateData.avatarUrl !== undefined) {
      updateData.avatar_url = updateData.avatarUrl;
      delete updateData.avatarUrl;
    }

    const { data: space, error } = await adminSupabase
      .from('spaces')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, resource_scopes(id)') // Include scope in update response
      .single();

    if (error) throw new Error(error.message);

    return {
      id: space.id,
      name: space.name,
      description: space.description,
      resourceScopeId: space.resource_scopes?.[0]?.id,
      coverUrl: space.cover_image_url,
      avatarUrl: space.avatar_url,
      createdAt: space.created_at,
      createdBy: space.created_by,
      settings: space.settings,
      isPrivate: space.is_private,
      updatedAt: space.updated_at,
    };
  }

  async deleteSpace(
    userClient: SupabaseClient,
    id: string,
    profileId: string
  ): Promise<void> {
    // 1. SECURITY: Verify Ownership
    await this.verifyProfileOwnership(userClient, profileId);

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
    // 1. SECURITY: Verify Ownership of Inviter
    await this.verifyProfileOwnership(userClient, inviterProfileId);

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

    return {
      spaceId: membership.space_id,
      profileId: membership.profile_id,
      role: membership.role,
      joinedAt: membership.joined_at,
    };
  }

  async getSpaceMembers(
    userClient: SupabaseClient,
    spaceId: string
  ): Promise<SpaceMember[]> {
    // RLS handles visibility.
    // Ensure the user actually has access to the space via RLS.
    const { data: members, error } = await userClient
      .from('space_members')
      .select(
        `
      *,
      profiles!inner (
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
      spaceId: member.space_id,
      profileId: member.profile_id,
      role: member.role,
      joinedAt: member.joined_at,
      profile: {
        id: member.profiles.id,
        displayName: member.profiles.display_name,
        avatarUrl: member.profiles.avatar_url,
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
    // 1. SECURITY: Verify Ownership
    await this.verifyProfileOwnership(userClient, removerProfileId);

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
    // 1. SECURITY: Verify Ownership
    await this.verifyProfileOwnership(userClient, updaterProfileId);

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
    return {
      spaceId: spaceId,
      profileId: membership.profile_id,
      role: membership.role,
      joinedAt: membership.joined_at,
    };
  }

  async getSpaceStats(
    userClient: SupabaseClient,
    profileId: string
  ): Promise<SpaceStats> {
    // STRICT FILTER: Only get stats for spaces THIS profile is a member of.
    // The !inner join is crucial here.
    const { data: spaces } = await userClient
      .from('spaces')
      .select('id, created_by, space_members!inner(profile_id)')
      .eq('space_members.profile_id', profileId);

    if (!spaces || spaces.length === 0)
      return {
        totalSpaces: 0,
        ownedSpaces: 0,
        memberSpaces: 0,
        totalMembers: 0,
        totalConversations: 0,
      };

    const totalSpaceIds = spaces.map((s) => s.id);
    const ownedSpaces = spaces.filter((s) => s.created_by === profileId);

    // Get conversations count for these spaces
    const { count: totalConvs } = await userClient
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('space_id', totalSpaceIds);

    // Get member count for OWNED spaces only (usually stats show size of communities you own)
    // Or you might want total members across all spaces you are in.
    // Implementation below matches original logic but scoped to ownedSpaces.
    let totalMembersCount = 0;
    if (ownedSpaces.length > 0) {
      const { count } = await userClient
        .from('space_members')
        .select('*', { count: 'exact', head: true })
        .in(
          'space_id',
          ownedSpaces.map((s) => s.id)
        );
      totalMembersCount = count || 0;
    }

    return {
      totalSpaces: spaces.length,
      ownedSpaces: ownedSpaces.length,
      memberSpaces: spaces.length - ownedSpaces.length,
      totalMembers: totalMembersCount,
      totalConversations: totalConvs || 0,
    };
  }
}

export const spacesService = new SpacesService();
