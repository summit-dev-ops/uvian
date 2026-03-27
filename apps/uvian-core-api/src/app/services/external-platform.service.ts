import { SupabaseClient } from '@supabase/supabase-js';
import { adminSupabase } from '../clients/supabase.client';

interface ExternalPlatform {
  id: string;
  owner_user_id: string;
  name: string;
  platform: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePlatformPayload {
  name: string;
  platform: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

interface UpdatePlatformPayload {
  name?: string;
  platform?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export class ExternalPlatformService {
  async getPlatformsByUser(
    userClient: SupabaseClient,
    userId: string
  ): Promise<ExternalPlatform[]> {
    const { data, error } = await userClient
      .from('external_platforms')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch platforms: ${error.message}`);
    }

    return data || [];
  }

  async getPlatformById(
    userClient: SupabaseClient,
    id: string
  ): Promise<ExternalPlatform | null> {
    const { data, error } = await userClient
      .from('external_platforms')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch platform: ${error.message}`);
    }

    return data || null;
  }

  async getPlatformByOwnerAndId(
    userClient: SupabaseClient,
    id: string,
    ownerUserId: string
  ): Promise<ExternalPlatform | null> {
    const { data, error } = await userClient
      .from('external_platforms')
      .select('*')
      .eq('id', id)
      .eq('owner_user_id', ownerUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch platform: ${error.message}`);
    }

    return data || null;
  }

  async getActivePlatformsByUser(
    userClient: SupabaseClient,
    userId: string
  ): Promise<ExternalPlatform[]> {
    const { data, error } = await userClient
      .from('external_platforms')
      .select('*')
      .eq('owner_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch platforms: ${error.message}`);
    }

    return data || [];
  }

  async getPlatformsByType(
    userClient: SupabaseClient,
    platform: string
  ): Promise<ExternalPlatform[]> {
    const { data, error } = await userClient
      .from('external_platforms')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch platforms: ${error.message}`);
    }

    return data || [];
  }

  async createPlatform(
    userClient: SupabaseClient,
    userId: string,
    payload: CreatePlatformPayload
  ): Promise<ExternalPlatform> {
    const { data, error } = await adminSupabase
      .from('external_platforms')
      .insert({
        owner_user_id: userId,
        name: payload.name,
        platform: payload.platform,
        config: payload.config || {},
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create platform: ${error.message}`);
    }

    return data;
  }

  async updatePlatform(
    userClient: SupabaseClient,
    userId: string,
    id: string,
    payload: Partial<UpdatePlatformPayload>
  ): Promise<ExternalPlatform> {
    const { data: existing, error: fetchError } = await userClient
      .from('external_platforms')
      .select('id')
      .eq('id', id)
      .eq('owner_user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Platform not found or access denied');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.platform !== undefined) updateData.platform = payload.platform;
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.is_active !== undefined)
      updateData.is_active = payload.is_active;

    const { data, error } = await adminSupabase
      .from('external_platforms')
      .update(updateData)
      .eq('id', id)
      .eq('owner_user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update platform: ${error.message}`);
    }

    return data;
  }

  async deletePlatform(
    userClient: SupabaseClient,
    userId: string,
    id: string
  ): Promise<void> {
    const { data: existing, error: fetchError } = await userClient
      .from('external_platforms')
      .select('id')
      .eq('id', id)
      .eq('owner_user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Platform not found or access denied');
    }

    const { error } = await adminSupabase
      .from('external_platforms')
      .delete()
      .eq('id', id)
      .eq('owner_user_id', userId);

    if (error) {
      throw new Error(`Failed to delete platform: ${error.message}`);
    }
  }
}

export const externalPlatformService = new ExternalPlatformService();
