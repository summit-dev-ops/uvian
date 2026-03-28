import { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../types/profile.types';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export class ProfileService {
  // Helper to get user ID from request (for backward compatibility)
  async getCurrentProfileFromRequest(request: any): Promise<string> {
    if (!request.user || !request.user.id) {
      throw new Error('User not authenticated');
    }
    return request.user.id;
  }

  async getProfile(clients: ServiceClients, profileId: string) {
    const { data, error } = await clients.userClient
      .schema('core_hub')
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      throw new Error('Profile not found');
    }

    return this.transformFromDatabase(data);
  }

  async getProfileByUserId(clients: ServiceClients, userId: string) {
    const { data, error } = await clients.userClient
      .schema('core_hub')
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Profile not found');
    }

    return this.transformFromDatabase(data);
  }

  private transformFromDatabase(record: Profile) {
    return {
      id: record.id,
      userId: record.user_id,
      displayName: record.display_name || '',
      avatarUrl: record.avatar_url || undefined,
      bio: record.bio || null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async createOrUpdateProfile(
    clients: ServiceClients,
    userId: string,
    data: { displayName?: string; avatarUrl?: string; bio?: string }
  ) {
    const updateData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (data.displayName !== undefined)
      updateData.display_name = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const { data: profile, error } = await clients.adminClient
      .schema('core_hub')
      .from('profiles')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  }

  async updateProfile(
    clients: ServiceClients,
    userId: string,
    profileId: string,
    data: { displayName?: string; avatarUrl?: string; bio?: string }
  ) {
    // Verify ownership via RLS
    const { data: existing } = await clients.userClient
      .schema('core_hub')
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Cannot update another user's profile");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.displayName !== undefined)
      updateData.display_name = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const { data: profile, error } = await clients.adminClient
      .schema('core_hub')
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  }

  async deleteProfile(
    clients: ServiceClients,
    userId: string,
    profileId: string
  ) {
    // Verify ownership via RLS
    const { data: existing } = await clients.userClient
      .schema('core_hub')
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Cannot delete another user's profile");
    }

    const { error } = await clients.adminClient
      .schema('core_hub')
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }
}

export const profileService = new ProfileService();
