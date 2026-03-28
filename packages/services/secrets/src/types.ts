import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export type SecretValueType = 'text' | 'json';

export interface CreateSecretPayload {
  name: string;
  valueType: SecretValueType;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSecretPayload {
  name?: string;
  value?: string;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface SecretRecord {
  id: string;
  accountId: string;
  name: string;
  valueType: SecretValueType;
  hasValue: boolean;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecretsScopedService {
  create(
    accountId: string,
    payload: CreateSecretPayload
  ): Promise<SecretRecord>;
  list(accountId: string): Promise<SecretRecord[]>;
  get(accountId: string, secretId: string): Promise<SecretRecord | null>;
  getByName(accountId: string, name: string): Promise<SecretRecord | null>;
  getByIdWithDecryptedValue(
    accountId: string,
    secretId: string
  ): Promise<{
    id: string;
    name: string;
    value: string;
    metadata: Record<string, unknown>;
  } | null>;
  update(
    accountId: string,
    secretId: string,
    payload: UpdateSecretPayload
  ): Promise<SecretRecord>;
  delete(accountId: string, secretId: string): Promise<{ success: boolean }>;
}

export interface SecretsAdminService {
  getById(secretId: string): Promise<SecretRecord | null>;
  getByAccountId(accountId: string): Promise<SecretRecord[]>;
  getByIdWithDecryptedValue(secretId: string): Promise<{
    id: string;
    name: string;
    value: string;
    metadata: Record<string, unknown>;
  } | null>;
  getAccountIdForUser(userId: string): Promise<string | null>;
}

export interface CreateSecretsServiceConfig {
  encryptionSecret: string;
}
