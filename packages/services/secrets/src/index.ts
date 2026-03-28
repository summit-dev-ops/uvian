import { SupabaseClient } from '@supabase/supabase-js';
import { encrypt, decryptJson } from '@org/utils-encryption';

export type SecretValueType = 'text' | 'json';

export interface CreateSecretPayload {
  accountId: string;
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

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

export interface CreateSecretsServiceConfig {
  encryptionSecret: string;
}

export interface SecretsService {
  create(
    clients: ServiceClients,
    payload: CreateSecretPayload
  ): Promise<SecretRecord>;
  list(clients: ServiceClients, accountId: string): Promise<SecretRecord[]>;
  get(clients: ServiceClients, secretId: string): Promise<SecretRecord | null>;
  getByName(
    clients: ServiceClients,
    accountId: string,
    name: string
  ): Promise<SecretRecord | null>;
  getByIdWithDecryptedValue(
    clients: ServiceClients,
    secretId: string
  ): Promise<{
    id: string;
    name: string;
    value: string;
    metadata: Record<string, unknown>;
  } | null>;
  update(
    clients: ServiceClients,
    secretId: string,
    payload: UpdateSecretPayload
  ): Promise<SecretRecord>;
  delete(
    clients: ServiceClients,
    secretId: string
  ): Promise<{ success: boolean }>;
  getAccountIdForUser(
    clients: ServiceClients,
    userId: string
  ): Promise<string | null>;
}

export function createSecretsService(
  config: CreateSecretsServiceConfig
): SecretsService {
  const { encryptionSecret } = config;

  return {
    async create(
      clients: ServiceClients,
      payload: CreateSecretPayload
    ): Promise<SecretRecord> {
      const encryptedValue = encrypt(payload.value, encryptionSecret);

      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .insert({
          account_id: payload.accountId,
          name: payload.name,
          value_type: payload.valueType,
          encrypted_value: encryptedValue,
          metadata: payload.metadata || {},
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async list(
      clients: ServiceClients,
      accountId: string
    ): Promise<SecretRecord[]> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map((row: unknown) => mapRow(row));
    },

    async get(
      clients: ServiceClients,
      secretId: string
    ): Promise<SecretRecord | null> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('id', secretId)
        .single();

      if (error || !data) throw new Error('Secret not found');
      return mapRow(data);
    },

    async getByName(
      clients: ServiceClients,
      accountId: string,
      name: string
    ): Promise<SecretRecord | null> {
      const { data, error } = await clients.userClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('account_id', accountId)
        .eq('name', name)
        .single();

      if (error || !data) return null;
      return mapRow(data);
    },

    async getByIdWithDecryptedValue(
      clients: ServiceClients,
      secretId: string
    ): Promise<{
      id: string;
      name: string;
      value: string;
      metadata: Record<string, unknown>;
    } | null> {
      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .select('*')
        .eq('id', secretId)
        .single();

      if (error || !data) return null;

      const decryptedValue = decryptJson<string>(
        data.encrypted_value,
        encryptionSecret
      );
      return {
        id: data.id,
        name: data.name,
        value: decryptedValue,
        metadata: data.metadata || {},
      };
    },

    async update(
      clients: ServiceClients,
      secretId: string,
      payload: UpdateSecretPayload
    ): Promise<SecretRecord> {
      const updateData: Record<string, unknown> = {};

      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.metadata !== undefined)
        updateData.metadata = payload.metadata;
      if (payload.isActive !== undefined)
        updateData.is_active = payload.isActive;
      if (payload.value !== undefined) {
        updateData.encrypted_value = encrypt(payload.value, encryptionSecret);
      }

      const { data, error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .update(updateData)
        .eq('id', secretId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data);
    },

    async delete(
      clients: ServiceClients,
      secretId: string
    ): Promise<{ success: boolean }> {
      const { error } = await clients.adminClient
        .schema('public')
        .from('secrets')
        .delete()
        .eq('id', secretId);

      if (error) throw new Error('Cannot delete secret');
      return { success: true };
    },

    async getAccountIdForUser(
      clients: ServiceClients,
      userId: string
    ): Promise<string | null> {
      const { data, error } = await clients.adminClient
        .from('account_members')
        .select('account_id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.account_id;
    },
  };
}

function mapRow(row: unknown): SecretRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    name: r.name as string,
    valueType: r.value_type as SecretValueType,
    hasValue: !!r.encrypted_value,
    metadata: r.metadata as Record<string, unknown>,
    isActive: r.is_active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
