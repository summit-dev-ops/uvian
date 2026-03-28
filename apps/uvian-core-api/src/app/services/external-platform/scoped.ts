import { ServiceClients } from '../types/service-clients';
import {
  ExternalPlatformScopedService,
  CreatePlatformPayload,
  UpdatePlatformPayload,
  ExternalPlatform,
} from './types';

export function createExternalPlatformScopedService(
  clients: ServiceClients
): ExternalPlatformScopedService {
  return {
    async getPlatformsByUser(userId: string): Promise<ExternalPlatform[]> {
      const { data, error } = await clients.userClient
        .from('external_platforms')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch platforms: ${error.message}`);
      }

      return data || [];
    },

    async getPlatformById(id: string): Promise<ExternalPlatform | null> {
      const { data, error } = await clients.userClient
        .from('external_platforms')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch platform: ${error.message}`);
      }

      return data || null;
    },

    async getPlatformByOwnerAndId(
      id: string,
      ownerUserId: string
    ): Promise<ExternalPlatform | null> {
      const { data, error } = await clients.userClient
        .from('external_platforms')
        .select('*')
        .eq('id', id)
        .eq('owner_user_id', ownerUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch platform: ${error.message}`);
      }

      return data || null;
    },

    async getActivePlatformsByUser(
      userId: string
    ): Promise<ExternalPlatform[]> {
      const { data, error } = await clients.userClient
        .from('external_platforms')
        .select('*')
        .eq('owner_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch platforms: ${error.message}`);
      }

      return data || [];
    },

    async createPlatform(
      userId: string,
      payload: CreatePlatformPayload
    ): Promise<ExternalPlatform> {
      const { data, error } = await clients.adminClient
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
    },

    async updatePlatform(
      userId: string,
      id: string,
      payload: Partial<UpdatePlatformPayload>
    ): Promise<ExternalPlatform> {
      const { data: existing, error: fetchError } = await clients.adminClient
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
      if (payload.platform !== undefined)
        updateData.platform = payload.platform;
      if (payload.config !== undefined) updateData.config = payload.config;
      if (payload.is_active !== undefined)
        updateData.is_active = payload.is_active;

      const { data, error } = await clients.adminClient
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
    },

    async deletePlatform(userId: string, id: string): Promise<void> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('external_platforms')
        .select('id')
        .eq('id', id)
        .eq('owner_user_id', userId)
        .single();

      if (fetchError || !existing) {
        throw new Error('Platform not found or access denied');
      }

      const { error } = await clients.adminClient
        .from('external_platforms')
        .delete()
        .eq('id', id)
        .eq('owner_user_id', userId);

      if (error) {
        throw new Error(`Failed to delete platform: ${error.message}`);
      }
    },
  };
}
