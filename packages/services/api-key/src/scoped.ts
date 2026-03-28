import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import {
  ServiceClients,
  ApiKeyScopedService,
  CreateApiKeyPayload,
  ApiKey,
} from './types';

function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sk_agent_${randomString}`;
}

async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 16);
}

export function createApiKeyScopedService(
  clients: ServiceClients
): ApiKeyScopedService {
  return {
    async getApiKeysByUser(userId: string): Promise<ApiKey[]> {
      const { data, error } = await clients.userClient
        .from('agent_api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`);
      }

      return data || [];
    },

    async createApiKey(
      userId: string,
      payload: CreateApiKeyPayload
    ): Promise<{ apiKey: string; userId: string; service: string }> {
      const apiKey = generateApiKey();
      const apiKeyHash = await hashApiKey(apiKey);
      const apiKeyPrefix = getApiKeyPrefix(apiKey);

      const { error: insertError } = await clients.adminClient
        .from('agent_api_keys')
        .insert({
          user_id: userId,
          api_key_hash: apiKeyHash,
          api_key_prefix: apiKeyPrefix,
          is_active: true,
          service: payload.service,
        });

      if (insertError) {
        throw new Error(`Failed to create API key: ${insertError.message}`);
      }

      return {
        apiKey,
        userId,
        service: payload.service,
      };
    },

    async revokeApiKey(
      userId: string,
      service: string,
      apiKeyPrefix?: string
    ): Promise<void> {
      const { data: existing, error: fetchError } = await clients.adminClient
        .from('agent_api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('service', service)
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(`Failed to fetch API key: ${fetchError.message}`);
      }

      if (!existing || existing.length === 0) {
        throw new Error('API key not found or access denied');
      }

      let updateQuery = clients.adminClient
        .from('agent_api_keys')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('service', service)
        .eq('is_active', true);

      if (apiKeyPrefix) {
        updateQuery = updateQuery.eq('api_key_prefix', apiKeyPrefix);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        throw new Error(`Failed to revoke API key: ${updateError.message}`);
      }
    },
  };
}
