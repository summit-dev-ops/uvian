import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface ApiKey {
  id: string;
  user_id: string;
  api_key_hash: string;
  api_key_prefix: string;
  is_active: boolean;
  service: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyPayload {
  service: string;
}

export interface ApiKeyScopedService {
  getApiKeysByUser(userId: string): Promise<ApiKey[]>;
  createApiKey(
    userId: string,
    payload: CreateApiKeyPayload
  ): Promise<{ apiKey: string; userId: string; service: string }>;
  revokeApiKey(
    userId: string,
    service: string,
    apiKeyPrefix?: string
  ): Promise<void>;
}

export interface ApiKeyAdminService {
  getApiKeyById(id: string): Promise<ApiKey | null>;
  getApiKeyByPrefix(apiKeyPrefix: string): Promise<ApiKey | null>;
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  getApiKeysByService(service: string): Promise<ApiKey[]>;
}

export interface CreateApiKeyServiceConfig {}
