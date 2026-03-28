import { ServiceClients } from '../types';
import {
  SpacesScopedService,
  Space,
  SpaceMember,
  SpaceStats,
  CreateSpaceInput,
  UpdateSpaceInput,
} from './types';

export function createSpacesScopedService(
  clients: ServiceClients
): SpacesScopedService {
  return {
    async getSpaces(): Promise<Space[]> {
      const { data, error } = await clients.userClient
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
    },

    async getSpace(spaceId: string): Promise<Space> {
      const { data, error } = await clients.userClient
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
    },

    async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
      const { data, error } = await clients.userClient
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
    },

    async getSpaceStats(userId: string): Promise<SpaceStats> {
      const { data: spaces } = await clients.userClient
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

      const ownedSpaces = spaces.filter(
        (s: { created_by: string }) => s.created_by === userId
      );

      const { count: totalConvs } = await clients.userClient
        .schema('core_hub')
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in(
          'space_id',
          spaces.map((s: { id: string }) => s.id)
        );

      let totalMembersCount = 0;
      if (ownedSpaces.length > 0) {
        const { count } = await clients.userClient
          .schema('core_hub')
          .from('space_members')
          .select('*', { count: 'exact', head: true })
          .in(
            'space_id',
            ownedSpaces.map((s: { id: string }) => s.id)
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
    },

    async createSpace(userId: string, data: CreateSpaceInput): Promise<Space> {
      const { data: space, error: spaceError } = await clients.adminClient
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

      await clients.adminClient
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
        description: space.description || null,
        avatarUrl: space.avatar_url || null,
        coverUrl: space.cover_url || null,
        memberCount: 0,
        conversationCount: 0,
        userRole: 'owner',
        syncStatus: 'synced' as const,
      };
    },

    async updateSpace(
      userId: string,
      spaceId: string,
      data: UpdateSpaceInput
    ): Promise<Space> {
      const { data: membership } = await clients.userClient
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

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.coverUrl !== undefined) updateData.cover_url = data.coverUrl;
      if (data.settings !== undefined) updateData.settings = data.settings;
      if (data.isPrivate !== undefined) updateData.is_private = data.isPrivate;

      const { data: space, error } = await clients.adminClient
        .schema('core_hub')
        .from('spaces')
        .update(updateData)
        .eq('id', spaceId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return {
        id: space.id,
        name: space.name,
        description: space.description,
        avatarUrl: space.avatar_url,
        coverUrl: space.cover_url,
        createdBy: space.created_by,
        settings: space.settings,
        isPrivate: space.is_private,
        createdAt: space.created_at,
        updatedAt: space.updated_at,
        memberCount: 0,
        conversationCount: 0,
        userRole: role || 'member',
        syncStatus: 'synced' as const,
      };
    },

    async deleteSpace(
      userId: string,
      spaceId: string
    ): Promise<{ success: boolean }> {
      const { data: space } = await clients.adminClient
        .schema('core_hub')
        .from('spaces')
        .select('created_by')
        .eq('id', spaceId)
        .single();

      if (!space) throw new Error('Space not found');

      if (space.created_by !== userId) {
        throw new Error('Only the owner can delete a space');
      }

      const { error } = await clients.adminClient
        .schema('core_hub')
        .from('spaces')
        .delete()
        .eq('id', spaceId);
      if (error) throw new Error(error.message);

      return { success: true };
    },

    async inviteMember(
      userId: string,
      spaceId: string,
      targetUserId: string,
      role: { name: string }
    ): Promise<SpaceMember> {
      const { data: inviterMembership } = await clients.userClient
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

      const { data: membership, error } = await clients.adminClient
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
    },

    async removeMember(
      userId: string,
      spaceId: string,
      targetUserId: string
    ): Promise<{ success: boolean }> {
      const isSelf = userId === targetUserId;

      const { data: removerMembership } = await clients.userClient
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

      const { error } = await clients.adminClient
        .schema('core_hub')
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', targetUserId);

      if (error) throw new Error(error.message);

      return { success: true };
    },

    async updateMemberRole(
      userId: string,
      spaceId: string,
      targetUserId: string,
      role: { name: string }
    ): Promise<SpaceMember> {
      const { data: updaterMembership } = await clients.userClient
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

      const { data: membership, error } = await clients.adminClient
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
    },
  };
}
