import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

export class SpacesService {
  async getSpaces(userClient: SupabaseClient) {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_spaces_for_current_user')
      .select('*');

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      avatarUrl: row.avatar_url,
      createdBy: row.created_by,
      settings: row.settings,
      isPrivate: row.is_private,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      memberCount: row.member_count,
      conversationCount: row.conversation_count,
      userRole: row.user_role,
      syncStatus: 'synced' as const,
    }));
  }

  async getSpace(userClient: SupabaseClient, spaceId: string) {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_space_details')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error || !data) {
      throw new Error('Space not found');
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      avatarUrl: data.avatar_url,
      coverUrl: data.cover_url,
      createdBy: data.created_by,
      settings: data.settings,
      isPrivate: data.is_private,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      memberCount: data.member_count,
      conversationCount: data.conversation_count,
      userRole: data.user_role,
      syncStatus: 'synced' as const,
    };
  }

  async getSpaceMembers(userClient: SupabaseClient, spaceId: string) {
    const { data, error } = await userClient
      .schema('core_hub')
      .from('get_space_members')
      .select('*')
      .eq('space_id', spaceId);

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      spaceId: row.space_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    }));
  }

  async getSpaceStats(userClient: SupabaseClient, userId: string) {
    const { data: spaces } = await userClient
      .schema('core_hub')
      .from('get_spaces_for_current_user')
      .select('id, created_by');

    if (!spaces || spaces.length === 0) {
      return {
        totalSpaces: 0,
        ownedSpaces: 0,
        memberSpaces: 0,
        totalMembers: 0,
        totalConversations: 0,
      };
    }

    const ownedSpaces = spaces.filter((s: any) => s.created_by === userId);

    const { count: totalConvs } = await userClient
      .schema('core_hub')
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in(
        'space_id',
        spaces.map((s: any) => s.id)
      );

    let totalMembersCount = 0;
    if (ownedSpaces.length > 0) {
      const { count } = await userClient
        .schema('core_hub')
        .from('space_members')
        .select('*', { count: 'exact', head: true })
        .in(
          'space_id',
          ownedSpaces.map((s: any) => s.id)
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

  async createSpace(
    userId: string,
    data: {
      id?: string;
      name: string;
      description?: string;
      avatarUrl?: string;
      coverUrl?: string;
      settings?: object;
      isPrivate?: boolean;
    }
  ) {
    const { data: space, error: spaceError } = await adminSupabase
      .schema('core_hub')
      .from('spaces')
      .insert({
        id: data.id,
        name: data.name,
        description: data.description,
        avatar_url: data.avatarUrl,
        cover_url: data.coverUrl,
        settings: data.settings || {},
        is_private: data.isPrivate ?? false,
        created_by: userId,
      })
      .select()
      .single();

    if (spaceError) throw new Error(spaceError.message);

    await adminSupabase
      .schema('core_hub')
      .from('space_members')
      .insert({
        space_id: space.id,
        user_id: userId,
        role: { name: 'owner' },
      });

    return {
      id: space.id,
      name: space.name,
      createdAt: space.created_at,
      createdBy: space.created_by,
      settings: space.settings,
      isPrivate: space.is_private,
      updatedAt: space.updated_at,
    };
  }

  async updateSpace(
    userClient: SupabaseClient,
    userId: string,
    spaceId: string,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      coverUrl?: string;
      settings?: object;
      isPrivate?: boolean;
    }
  ) {
    // Check membership role
    const { data: membership } = await userClient
      .schema('core_hub')
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    const role = membership?.role?.name;
    if (role !== 'owner' && role !== 'admin') {
      throw new Error('Only admins or owners can update spaces');
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.isPrivate !== undefined) updateData.is_private = data.isPrivate;

    const { data: space, error } = await adminSupabase
      .schema('core_hub')
      .from('spaces')
      .update(updateData)
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return space;
  }

  async deleteSpace(
    userClient: SupabaseClient,
    userId: string,
    spaceId: string
  ) {
    // Check ownership
    const { data: space } = await adminSupabase
      .schema('core_hub')
      .from('spaces')
      .select('created_by')
      .eq('id', spaceId)
      .single();

    if (!space) throw new Error('Space not found');

    if (space.created_by !== userId) {
      throw new Error('Only the owner can delete a space');
    }

    const { error } = await adminSupabase
      .schema('core_hub')
      .from('spaces')
      .delete()
      .eq('id', spaceId);
    if (error) throw new Error(error.message);

    return { success: true };
  }

  async inviteMember(
    userClient: SupabaseClient,
    userId: string,
    spaceId: string,
    targetUserId: string,
    role: { name: string }
  ) {
    // Check inviter role
    const { data: inviterMembership } = await userClient
      .schema('core_hub')
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    const inviterRole = inviterMembership?.role?.name;
    if (inviterRole !== 'owner' && inviterRole !== 'admin') {
      throw new Error('Insufficient permissions to invite');
    }

    const { data: membership, error } = await adminSupabase
      .schema('core_hub')
      .from('space_members')
      .insert({
        space_id: spaceId,
        user_id: targetUserId,
        role: role || { name: 'member' },
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      spaceId: membership.space_id,
      userId: membership.user_id,
      role: membership.role,
      joinedAt: membership.joined_at,
    };
  }

  async removeMember(
    userClient: SupabaseClient,
    userId: string,
    spaceId: string,
    targetUserId: string
  ) {
    const isSelf = userId === targetUserId;

    // Check remover role
    const { data: removerMembership } = await userClient
      .schema('core_hub')
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    const removerRole = removerMembership?.role?.name;

    if (!isSelf && removerRole !== 'owner' && removerRole !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    const { error } = await adminSupabase
      .schema('core_hub')
      .from('space_members')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', targetUserId);

    if (error) throw new Error(error.message);

    return { success: true };
  }

  async updateMemberRole(
    userClient: SupabaseClient,
    userId: string,
    spaceId: string,
    targetUserId: string,
    role: { name: string }
  ) {
    // Check updater role
    const { data: updaterMembership } = await userClient
      .schema('core_hub')
      .from('space_members')
      .select('role')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    const updaterRole = updaterMembership?.role?.name;
    if (updaterRole !== 'owner' && updaterRole !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    const { data: membership, error } = await adminSupabase
      .schema('core_hub')
      .from('space_members')
      .update({ role })
      .eq('space_id', spaceId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      spaceId: membership.space_id,
      userId: membership.user_id,
      role: membership.role,
      joinedAt: membership.joined_at,
    };
  }
}

export const spacesService = new SpacesService();
