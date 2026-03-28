import { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sk_agent_${randomString}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 16);
}

export interface CreateApiKeyResult {
  api_key: string;
  user_id: string;
  service: string;
}

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateApiKeyServiceConfig {}

export interface ApiKeyService {
  createApiKey(
    clients: ServiceClients,
    targetUserId: string,
    service: string
  ): Promise<CreateApiKeyResult>;
  revokeApiKey(
    clients: ServiceClients,
    targetUserId: string,
    service: string,
    apiKeyPrefix?: string
  ): Promise<void>;
}

export function createApiKeyService(
  _config: CreateApiKeyServiceConfig
): ApiKeyService {
  return {
    async createApiKey(
      clients: ServiceClients,
      targetUserId: string,
      service: string
    ): Promise<CreateApiKeyResult> {
      const apiKey = generateApiKey();
      const apiKeyHash = await hashApiKey(apiKey);
      const apiKeyPrefix = getApiKeyPrefix(apiKey);

      const { error: insertError } = await clients.adminClient
        .from('agent_api_keys')
        .insert({
          user_id: targetUserId,
          api_key_hash: apiKeyHash,
          api_key_prefix: apiKeyPrefix,
          is_active: true,
          service,
        });

      if (insertError) {
        throw new Error(`Failed to create API key: ${insertError.message}`);
      }

      return {
        api_key: apiKey,
        user_id: targetUserId,
        service,
      };
    },

    async revokeApiKey(
      clients: ServiceClients,
      targetUserId: string,
      service: string,
      apiKeyPrefix?: string
    ): Promise<void> {
      let updateQuery = clients.adminClient
        .from('agent_api_keys')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('service', service);

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
