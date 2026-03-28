import { ServiceClients, ApiKeyAdminService, ApiKey } from './types';

export function createApiKeyAdminService(
  clients: ServiceClients
): ApiKeyAdminService {
  return {
    async getApiKeyById(id: string): Promise<ApiKey | null> {
      const { data, error } = await clients.adminClient
        .from('agent_api_keys')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch API key: ${error.message}`);
      }

      return data || null;
    },

    async getApiKeyByPrefix(apiKeyPrefix: string): Promise<ApiKey | null> {
      const { data, error } = await clients.adminClient
        .from('agent_api_keys')
        .select('*')
        .eq('api_key_prefix', apiKeyPrefix)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch API key: ${error.message}`);
      }

      return data || null;
    },

    async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
      const { data, error } = await clients.adminClient
        .from('agent_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`);
      }

      return data || [];
    },

    async getApiKeysByService(service: string): Promise<ApiKey[]> {
      const { data, error } = await clients.adminClient
        .from('agent_api_keys')
        .select('*')
        .eq('service', service)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`);
      }

      return data || [];
    },
  };
}
