import { ServiceClients } from '../types/service-clients';
import { ExternalPlatformAdminService, ExternalPlatform } from './types';

export function createExternalPlatformAdminService(
  clients: ServiceClients
): ExternalPlatformAdminService {
  return {
    async getPlatformById(id: string): Promise<ExternalPlatform | null> {
      const { data, error } = await clients.adminClient
        .from('external_platforms')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch platform: ${error.message}`);
      }

      return data || null;
    },

    async getPlatformsByOwner(
      ownerUserId: string
    ): Promise<ExternalPlatform[]> {
      const { data, error } = await clients.adminClient
        .from('external_platforms')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch platforms: ${error.message}`);
      }

      return data || [];
    },

    async getActivePlatforms(): Promise<ExternalPlatform[]> {
      const { data, error } = await clients.adminClient
        .from('external_platforms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch platforms: ${error.message}`);
      }

      return data || [];
    },

    async getPlatformsByType(platform: string): Promise<ExternalPlatform[]> {
      const { data, error } = await clients.adminClient
        .from('external_platforms')
        .select('*')
        .eq('platform', platform)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch platforms: ${error.message}`);
      }

      return data || [];
    },
  };
}
